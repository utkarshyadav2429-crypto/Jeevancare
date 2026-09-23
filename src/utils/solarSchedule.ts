/**
 * Astronomical and System-Clock Day/Night Solar Schedule Engine for Jevan Care
 * Computes exact sunrise and sunset times using NOAA Solar Zenith algorithms
 * based on geolocation coordinates or local system clock schedule fallback.
 */

export interface SolarScheduleResult {
  isDaytime: boolean;
  sunriseTime: string | null;
  sunsetTime: string | null;
  source: 'geolocation' | 'system_clock';
  nextTransition: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  minutesUntilNextTransition: number;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function formatHourMinute(decimalHours: number): string {
  const normalized = ((decimalHours % 24) + 24) % 24;
  const h = Math.floor(normalized);
  const m = Math.floor((normalized - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : String(m);
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Calculates astronomical sunrise and sunset given latitude and longitude.
 * Standard NOAA Solar Zenith formula (90°50' = 90.833° official zenith).
 */
export function calculateSolarSchedule(
  lat: number,
  lng: number,
  date: Date = new Date()
): SolarScheduleResult {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const n1 = Math.floor((275 * month) / 9);
  const n2 = Math.floor((month + 9) / 12);
  const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const dayOfYear = n1 - n2 * n3 + day - 30;

  const lngHour = lng / 15;

  function calcUT(isSunrise: boolean): { hours?: number; polar?: 'night' | 'day' } {
    const t = isSunrise
      ? dayOfYear + (6 - lngHour) / 24
      : dayOfYear + (18 - lngHour) / 24;

    const M = 0.9856 * t - 3.289;
    let L =
      M +
      1.916 * Math.sin(degToRad(M)) +
      0.02 * Math.sin(degToRad(2 * M)) +
      282.634;
    L = ((L % 360) + 360) % 360;

    let RA = radToDeg(Math.atan(0.91764 * Math.tan(degToRad(L))));
    RA = ((RA % 360) + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);
    RA = RA / 15;

    const sinDec = 0.39782 * Math.sin(degToRad(L));
    const cosDec = Math.cos(Math.asin(sinDec));

    // Zenith 90.833° accounts for atmospheric refraction and solar disc
    const cosH =
      (Math.cos(degToRad(90.833)) - sinDec * Math.sin(degToRad(lat))) /
      (cosDec * Math.cos(degToRad(lat)));

    if (cosH > 1) return { polar: 'night' };
    if (cosH < -1) return { polar: 'day' };

    let H = isSunrise ? 360 - radToDeg(Math.acos(cosH)) : radToDeg(Math.acos(cosH));
    H = H / 15;

    const T = H + RA - 0.06571 * t - 6.622;
    let UT = T - lngHour;
    UT = ((UT % 24) + 24) % 24;

    return { hours: UT };
  }

  const riseRes = calcUT(true);
  const setRes = calcUT(false);

  // Handle extreme polar coordinates (midnight sun or polar night)
  if (riseRes.polar || setRes.polar) {
    const isPolarDay = riseRes.polar === 'day' || setRes.polar === 'day';
    return {
      isDaytime: isPolarDay,
      sunriseTime: null,
      sunsetTime: null,
      source: 'geolocation',
      nextTransition: isPolarDay ? 'Polar Day (Continuous Sun)' : 'Polar Night (Continuous Dark)',
      coordinates: { latitude: lat, longitude: lng },
      minutesUntilNextTransition: 720,
    };
  }

  const riseUT = riseRes.hours ?? 6;
  const setUT = setRes.hours ?? 18;

  const currentUtcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  let isDaytime: boolean;
  if (riseUT <= setUT) {
    isDaytime = currentUtcHours >= riseUT && currentUtcHours < setUT;
  } else {
    // Spanning UTC midnight boundary
    isDaytime = currentUtcHours >= riseUT || currentUtcHours < setUT;
  }

  // Convert UTC decimal hours to user's local timezone for human display
  const tzOffsetHours = -date.getTimezoneOffset() / 60;
  let localRise = (riseUT + tzOffsetHours) % 24;
  if (localRise < 0) localRise += 24;

  let localSet = (setUT + tzOffsetHours) % 24;
  if (localSet < 0) localSet += 24;

  const sunriseStr = formatHourMinute(localRise);
  const sunsetStr = formatHourMinute(localSet);

  // Calculate approximate minutes until next transition
  let minutesUntil = 60;
  const currentLocalHours =
    date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  if (isDaytime) {
    let diffHours = localSet - currentLocalHours;
    if (diffHours < 0) diffHours += 24;
    minutesUntil = Math.max(1, Math.round(diffHours * 60));
  } else {
    let diffHours = localRise - currentLocalHours;
    if (diffHours < 0) diffHours += 24;
    minutesUntil = Math.max(1, Math.round(diffHours * 60));
  }

  const nextTransition = isDaytime
    ? `Sunset at ${sunsetStr}`
    : `Sunrise at ${sunriseStr}`;

  return {
    isDaytime,
    sunriseTime: sunriseStr,
    sunsetTime: sunsetStr,
    source: 'geolocation',
    nextTransition,
    coordinates: { latitude: lat, longitude: lng },
    minutesUntilNextTransition: minutesUntil,
  };
}

/**
 * Fallback schedule based solely on local system time (day/night schedule)
 * Default daytime: 6:30 AM to 6:30 PM (18:30)
 */
export function calculateClockSchedule(
  date: Date = new Date(),
  dayStartHour: number = 6.5,  // 06:30 AM
  nightStartHour: number = 18.5 // 06:30 PM
): SolarScheduleResult {
  const currentLocalHours =
    date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  const isDaytime =
    currentLocalHours >= dayStartHour && currentLocalHours < nightStartHour;

  const sunriseStr = formatHourMinute(dayStartHour);
  const sunsetStr = formatHourMinute(nightStartHour);

  let minutesUntil = 60;
  if (isDaytime) {
    let diff = nightStartHour - currentLocalHours;
    if (diff < 0) diff += 24;
    minutesUntil = Math.max(1, Math.round(diff * 60));
  } else {
    let diff = dayStartHour - currentLocalHours;
    if (diff < 0) diff += 24;
    minutesUntil = Math.max(1, Math.round(diff * 60));
  }

  const nextTransition = isDaytime
    ? `Sunset at ${sunsetStr}`
    : `Sunrise at ${sunriseStr}`;

  return {
    isDaytime,
    sunriseTime: sunriseStr,
    sunsetTime: sunsetStr,
    source: 'system_clock',
    nextTransition,
    coordinates: null,
    minutesUntilNextTransition: minutesUntil,
  };
}

/**
 * Determines current daytime status based on geolocation if available,
 * or falls back to the user's local system time.
 */
export function getActiveSchedule(
  coords: { latitude: number; longitude: number } | null | undefined,
  date: Date = new Date()
): SolarScheduleResult {
  if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
    try {
      return calculateSolarSchedule(coords.latitude, coords.longitude, date);
    } catch (e) {
      console.warn('Error computing solar schedule from coordinates, falling back to system clock:', e);
    }
  }
  return calculateClockSchedule(date);
}
