import {
  MedBuddyPricingConfig,
  TransportPricingConfig,
  PriceSnapshot
} from '../types';
import {
  calculateHaversineDistanceKm,
  isValidCoordinate,
  InvalidCoordinatesError,
} from './locationService';

// Default Master MedBuddy Pricing Config
export const DEFAULT_MEDBUDDY_PRICING_CONFIG: MedBuddyPricingConfig = {
  baseServiceFee: 299, // Includes initial companion matching & first hour
  hourlyRate: 149, // Per additional hour of companion assistance
  additionalHourRate: 149,
  nightSurcharge: 99, // For bookings between 8:00 PM and 6:00 AM
  weekendSurcharge: 49, // Saturday & Sunday bookings
  platformFee: 39, // Network security & operational support fee
  cancellationFee: 99, // If cancelled after companion is en-route
  taxRate: 0.05, // 5% GST on platform & companion services
  includedWaitingMinutes: 30, // Included companion waiting buffer
  extraWaitingPerMinuteRate: 2, // ₹2/min beyond included buffer
};

// Default Master Transport Fare Config (Estimated Cab/Auto Fare Engine)
export const DEFAULT_TRANSPORT_PRICING_CONFIG: TransportPricingConfig = {
  baseFare: 50,
  perKm: 14,
  perMinute: 2,
  bookingFee: 20,
  taxPercent: 5,
  surgeMultiplier: 1.0,
};

const LOCAL_STORAGE_KEY_PRICING = 'jeevancare_medbuddy_pricing_config';
const LOCAL_STORAGE_KEY_TRANSPORT = 'jeevancare_medbuddy_transport_config';

export const medbuddyPricingService = {
  /**
   * Get active companion pricing config (Admin configurable)
   */
  getPricingConfig(): MedBuddyPricingConfig {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_PRICING);
      if (stored) {
        return { ...DEFAULT_MEDBUDDY_PRICING_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_MEDBUDDY_PRICING_CONFIG;
  },

  /**
   * Save updated companion pricing config (Admin)
   */
  savePricingConfig(config: MedBuddyPricingConfig): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_PRICING, JSON.stringify(config));
  },

  /**
   * Reset pricing config to factory defaults
   */
  resetPricingConfig(): MedBuddyPricingConfig {
    localStorage.removeItem(LOCAL_STORAGE_KEY_PRICING);
    return DEFAULT_MEDBUDDY_PRICING_CONFIG;
  },

  /**
   * Get active transport fare engine config
   */
  getTransportConfig(): TransportPricingConfig {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSPORT);
      if (stored) {
        return { ...DEFAULT_TRANSPORT_PRICING_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TRANSPORT_PRICING_CONFIG;
  },

  /**
   * Save transport fare engine config (Admin)
   */
  saveTransportConfig(config: TransportPricingConfig): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_TRANSPORT, JSON.stringify(config));
  },

  /**
   * Estimate road distance & driving duration between two coordinates
   */
  estimateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): { distanceKm: number; durationMinutes: number } {
    if (!isValidCoordinate(origin?.lat, origin?.lng) || !isValidCoordinate(destination?.lat, destination?.lng)) {
      throw new InvalidCoordinatesError(origin, destination);
    }

    const rawHaversine = calculateHaversineDistanceKm(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    // City urban driving path multiplier: ~1.28x straight line distance
    const roadDistanceKm = Math.max(0.8, Math.round(rawHaversine * 1.28 * 10) / 10);
    
    // Average city traffic speed ~ 22 km/h + 4 min base traffic signal buffer
    const durationMinutes = Math.max(8, Math.round((roadDistanceKm / 22) * 60 + 4));

    return {
      distanceKm: roadDistanceKm,
      durationMinutes,
    };
  },

  /**
   * Calculate transparent transport fare range for a leg
   */
  calculateLegTransportFare(
    distanceKm: number,
    durationMinutes: number,
    config = this.getTransportConfig()
  ): { minFare: number; maxFare: number } {
    const distanceFare = distanceKm * config.perKm;
    const timeFare = durationMinutes * config.perMinute;
    const baseSum = (config.baseFare + distanceFare + timeFare + config.bookingFee) * config.surgeMultiplier;
    const taxAmount = (baseSum * config.taxPercent) / 100;

    const standardTotal = baseSum + taxAmount;

    // Truthful range based on real city cab traffic fluctuations (±15%)
    const minFare = Math.max(80, Math.round((standardTotal * 0.9) / 10) * 10);
    const maxFare = Math.max(minFare + 40, Math.round((standardTotal * 1.22) / 10) * 10);

    return { minFare, maxFare };
  },

  /**
   * Parse expected hospital duration option into hours
   */
  parseExpectedHospitalHours(durationOption: string): number {
    switch (durationOption) {
      case '<1 hour':
        return 1.0;
      case '1–2 hours':
        return 1.75;
      case '2–4 hours':
        return 3.0;
      case '4–6 hours':
        return 5.0;
      case 'Not sure':
      default:
        return 2.5;
    }
  },

  /**
   * Calculate full transparent pricing breakdown & Price Snapshot
   */
  calculatePriceSnapshot(params: {
    pickupCoordinates: { lat: number; lng: number };
    destinationCoordinates: { lat: number; lng: number };
    scheduledAt: string;
    expectedHospitalDuration: string;
    returnRequired: boolean;
  }): PriceSnapshot {
    const pricingConfig = this.getPricingConfig();
    const transportConfig = this.getTransportConfig();

    // 1. Route calculations
    const outboundRoute = this.estimateRoute(
      params.pickupCoordinates,
      params.destinationCoordinates
    );
    const outboundFare = this.calculateLegTransportFare(
      outboundRoute.distanceKm,
      outboundRoute.durationMinutes,
      transportConfig
    );

    let returnDistanceKm = 0;
    let returnDurationMinutes = 0;
    let returnTransportMin = 0;
    let returnTransportMax = 0;

    if (params.returnRequired) {
      const returnRoute = this.estimateRoute(
        params.destinationCoordinates,
        params.pickupCoordinates
      );
      returnDistanceKm = returnRoute.distanceKm;
      returnDurationMinutes = returnRoute.durationMinutes;

      const returnFare = this.calculateLegTransportFare(
        returnDistanceKm,
        returnDurationMinutes,
        transportConfig
      );
      returnTransportMin = returnFare.minFare;
      returnTransportMax = returnFare.maxFare;
    }

    // 2. Time & Surcharges
    const scheduledDate = new Date(params.scheduledAt || Date.now());
    const hour = scheduledDate.getHours();
    const day = scheduledDate.getDay(); // 0 = Sunday, 6 = Saturday

    const isNight = hour >= 20 || hour < 6;
    const isWeekend = day === 0 || day === 6;

    const nightSurcharge = isNight ? pricingConfig.nightSurcharge : 0;
    const weekendSurcharge = isWeekend ? pricingConfig.weekendSurcharge : 0;

    // 3. Companion Duration & Fee
    const hospitalStayHours = this.parseExpectedHospitalHours(params.expectedHospitalDuration);
    const travelHours = ((outboundRoute.durationMinutes + returnDurationMinutes) / 60);
    const totalCompanionHours = Math.round((hospitalStayHours + travelHours + 0.3) * 10) / 10; // +0.3h buffer

    // Base fee covers 1st hour
    const additionalHours = Math.max(0, totalCompanionHours - 1);
    const additionalHoursFee = Math.round(additionalHours * pricingConfig.additionalHourRate);

    const companionFee =
      pricingConfig.baseServiceFee +
      additionalHoursFee +
      nightSurcharge +
      weekendSurcharge;

    const platformFee = pricingConfig.platformFee;
    const taxableServiceAmount = companionFee + platformFee;
    const taxAmount = Math.round(taxableServiceAmount * pricingConfig.taxRate);

    const totalTransportMin = outboundFare.minFare + returnTransportMin;
    const totalTransportMax = outboundFare.maxFare + returnTransportMax;

    const estimatedTotalMin = companionFee + platformFee + taxAmount + totalTransportMin;
    const estimatedTotalMax = companionFee + platformFee + taxAmount + totalTransportMax;

    return {
      pricingConfigVersion: '2026.1-v1',
      baseServiceFee: pricingConfig.baseServiceFee,
      hourlyRate: pricingConfig.hourlyRate,
      estimatedCompanionHours: totalCompanionHours,
      companionFee,
      platformFee,
      taxRate: pricingConfig.taxRate,
      taxAmount,
      outboundDistanceKm: outboundRoute.distanceKm,
      outboundDurationMinutes: outboundRoute.durationMinutes,
      outboundTransportMin: outboundFare.minFare,
      outboundTransportMax: outboundFare.maxFare,
      returnRequired: params.returnRequired,
      returnDistanceKm,
      returnDurationMinutes,
      returnTransportMin,
      returnTransportMax,
      totalTransportMin,
      totalTransportMax,
      estimatedTotalMin,
      estimatedTotalMax,
      currency: 'INR',
      cancellationPolicy: {
        freeCancellationMinutes: 10,
        fee: pricingConfig.cancellationFee,
        description: 'Free cancellation up to 10 minutes after booking or before MedBuddy departs. Standard ₹99 fee applies if cancelled once companion is en-route.',
      },
    };
  },
};
