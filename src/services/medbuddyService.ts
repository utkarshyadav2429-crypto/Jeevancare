import {
  MedBuddyBooking,
  MedBuddyBookingStatus,
  MedBuddyProfile,
  MedBuddyBookingEvent,
  MedBuddyBookingTask,
  PriceSnapshot
} from '../types';
import { INITIAL_VERIFIED_BUDDIES, DEFAULT_HOSPITAL_TASKS } from '../data/medbuddyInitialData';
import {
  calculateHaversineDistanceKm,
  enforceValidFreshCoordinates,
  isValidCoordinate,
} from './locationService';
import { auditLogger } from './AuditLogger';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  BOOKINGS: 'jeevancare_medbuddy_bookings_db',
  BUDDIES: 'jeevancare_medbuddy_buddies_db',
  EVENTS: 'jeevancare_medbuddy_events_db',
};

// Generate 4-digit numeric verification PIN
export function generatePickupPin(): string {
  const pin = Math.floor(1000 + Math.random() * 9000);
  return String(pin);
}

// Valid State Transitions Map
export const VALID_STATUS_TRANSITIONS: Record<MedBuddyBookingStatus, MedBuddyBookingStatus[]> = {
  REQUESTED: ['SEARCHING_FOR_BUDDY', 'CANCELLED'],
  SEARCHING_FOR_BUDDY: ['BUDDY_ASSIGNED', 'CANCELLED'],
  BUDDY_ASSIGNED: ['BUDDY_EN_ROUTE', 'SEARCHING_FOR_BUDDY', 'CANCELLED'],
  BUDDY_EN_ROUTE: ['BUDDY_ARRIVED', 'CANCELLED'],
  BUDDY_ARRIVED: ['PICKUP_CONFIRMED', 'CANCELLED'],
  PICKUP_CONFIRMED: ['TRAVELLING_TO_HOSPITAL', 'CANCELLED'],
  TRAVELLING_TO_HOSPITAL: ['ARRIVED_AT_HOSPITAL', 'CANCELLED'],
  ARRIVED_AT_HOSPITAL: ['REGISTRATION_ASSISTANCE', 'WAITING_WITH_PATIENT', 'RETURN_TRIP', 'CANCELLED'],
  REGISTRATION_ASSISTANCE: ['WAITING_WITH_PATIENT', 'DISCHARGE_ASSISTANCE', 'RETURN_TRIP', 'CANCELLED'],
  WAITING_WITH_PATIENT: ['DISCHARGE_ASSISTANCE', 'RETURN_TRIP', 'CANCELLED'],
  DISCHARGE_ASSISTANCE: ['RETURN_TRIP', 'DROPPED_HOME', 'CANCELLED'],
  RETURN_TRIP: ['DROPPED_HOME', 'CANCELLED'],
  DROPPED_HOME: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const medbuddyService = {
  /**
   * Fetch all registered MedBuddy profiles (Admin & Matching)
   */
  async getBuddies(): Promise<MedBuddyProfile[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BUDDIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    // Seed defaults
    localStorage.setItem(STORAGE_KEYS.BUDDIES, JSON.stringify(INITIAL_VERIFIED_BUDDIES));
    return INITIAL_VERIFIED_BUDDIES;
  },

  /**
   * Save buddies list
   */
  saveBuddies(buddies: MedBuddyProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.BUDDIES, JSON.stringify(buddies));
  },

  /**
   * Get buddy by ID
   */
  async getBuddyById(buddyId: string): Promise<MedBuddyProfile | null> {
    const buddies = await this.getBuddies();
    return buddies.find((b) => b.id === buddyId) || null;
  },

  /**
   * Update Buddy Status / Verification (Admin)
   */
  async updateBuddyVerification(
    buddyId: string,
    status: 'verified' | 'pending' | 'suspended',
    adminId = 'admin_ops'
  ): Promise<MedBuddyProfile | null> {
    const buddies = await this.getBuddies();
    let updated: MedBuddyProfile | null = null;

    const modified = buddies.map((b) => {
      if (b.id === buddyId) {
        updated = {
          ...b,
          verificationStatus: status,
          backgroundVerified: status === 'verified' ? true : b.backgroundVerified,
        };
        return updated;
      }
      return b;
    });

    this.saveBuddies(modified);
    auditLogger.logAction(
      'MEDBUDDY_VERIFICATION_UPDATE',
      `MedBuddy ${buddyId} verification status set to ${status} by ${adminId}`,
      { buddyId, status },
      'SUCCESS'
    );
    return updated;
  },

  /**
   * Toggle Buddy Availability (Companion Portal)
   */
  async setBuddyAvailability(
    buddyId: string,
    availability: 'available' | 'busy' | 'offline' | 'suspended'
  ): Promise<MedBuddyProfile | null> {
    const buddies = await this.getBuddies();
    let updated: MedBuddyProfile | null = null;

    const modified = buddies.map((b) => {
      if (b.id === buddyId) {
        updated = { ...b, currentAvailability: availability };
        return updated;
      }
      return b;
    });

    this.saveBuddies(modified);
    return updated;
  },

  /**
   * Fetch all bookings
   */
  async getBookings(): Promise<MedBuddyBooking[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Save bookings list
   */
  saveBookings(bookings: MedBuddyBooking[]): void {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  /**
   * Get single booking by ID
   */
  async getBookingById(bookingId: string): Promise<MedBuddyBooking | null> {
    const bookings = await this.getBookings();
    return bookings.find((b) => b.id === bookingId) || null;
  },

  /**
   * Get user-scoped bookings
   */
  async getUserBookings(patientId: string): Promise<MedBuddyBooking[]> {
    const bookings = await this.getBookings();
    return bookings
      .filter((b) => b.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get bookings assigned to a specific MedBuddy
   */
  async getBuddyAssignedBookings(buddyId: string): Promise<MedBuddyBooking[]> {
    const bookings = await this.getBookings();
    return bookings
      .filter((b) => b.assignedBuddyId === buddyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Intelligent Candidate Matching Algorithm
   * Scores verified & available companions by proximity, workload, and rating
   */
  async findBestMatchingBuddy(
    pickupCoords: { lat: number; lng: number; timestamp?: number },
    requestedLanguages: string[] = ['Hindi']
  ): Promise<{ buddy: MedBuddyProfile; score: number; distanceKm: number } | null> {
    const validLoc = enforceValidFreshCoordinates(pickupCoords?.lat, pickupCoords?.lng, pickupCoords?.timestamp, {
      serviceName: 'MedBuddy Candidate Matching',
    });

    const allBuddies = await this.getBuddies();
    const existingBookings = await this.getBookings();

    // 1. Hard constraints: Verified & Available & No active booking & Valid coordinates
    const activeBookingBuddyIds = new Set(
      existingBookings
        .filter(
          (b) =>
            !['COMPLETED', 'CANCELLED'].includes(b.status) &&
            b.assignedBuddyId
        )
        .map((b) => b.assignedBuddyId as string)
    );

    const candidates = allBuddies.filter((b) => {
      if (b.verificationStatus !== 'verified') return false;
      if (b.currentAvailability !== 'available') return false;
      if (activeBookingBuddyIds.has(b.id)) return false; // Double-booking protection
      if (!b.currentCoordinates || !isValidCoordinate(b.currentCoordinates.lat, b.currentCoordinates.lng)) return false;
      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    // 2. Score candidates
    const scored = candidates.map((buddy) => {
      const buddyCoords = buddy.currentCoordinates!;
      const distKm = calculateHaversineDistanceKm(
        validLoc.latitude,
        validLoc.longitude,
        buddyCoords.lat,
        buddyCoords.lng
      );

      // Proximity score (Max 50 pts, closer is higher)
      const proximityScore = Math.max(0, 50 - distKm * 3);
      // Rating score (Max 30 pts)
      const ratingScore = (buddy.rating / 5.0) * 30;
      // Experience / Trips score (Max 15 pts)
      const experienceScore = Math.min(15, (buddy.completedTrips / 100) * 15);
      // Language match (5 pts)
      const hasLang = requestedLanguages.some((l) =>
        buddy.languages.some((bl) => bl.toLowerCase().includes(l.toLowerCase()))
      );
      const languageScore = hasLang ? 5 : 0;

      const totalScore = Math.round((proximityScore + ratingScore + experienceScore + languageScore) * 10) / 10;

      return {
        buddy,
        score: totalScore,
        distanceKm: distKm,
      };
    });

    // Rank highest score first
    scored.sort((a, b) => b.score - a.score);
    return scored[0] || null;
  },

  /**
   * Create New Real MedBuddy Booking
   */
  async createBooking(params: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    isForSelf: boolean;
    patientRelationship?: string;
    patientAge?: number;
    reasonCategory: string;
    customReason?: string;
    emergencyScreeningCleared: boolean;
    pickupAddress: string;
    pickupCoordinates: { lat: number; lng: number };
    destinationPlaceId?: string;
    destinationName: string;
    destinationAddress: string;
    destinationCoordinates: { lat: number; lng: number };
    destinationPhone?: string;
    destinationMapsUrl?: string;
    scheduledAt: string;
    isAsap: boolean;
    expectedHospitalDuration: string;
    estimatedTotalDurationMinutes: number;
    returnRequired: boolean;
    returnOption: 'after_appointment' | 'specific_time' | 'after_discharge' | 'decide_later';
    requestedServices: string[];
    mobilityRequirement: 'independent' | 'walking_assistance' | 'wheelchair' | 'walking_stick' | 'extra_assistance';
    priceSnapshot: PriceSnapshot;
  }): Promise<MedBuddyBooking> {
    const bookingId = `MB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();
    const pickupPin = generatePickupPin();

    // Generate initial tasks checklist based on requested services
    const initialTasks: MedBuddyBookingTask[] = DEFAULT_HOSPITAL_TASKS.map((t, idx) => ({
      id: `task_${idx + 1}`,
      title: t.title,
      category: t.category,
      completed: false,
    }));

    const initialEvent: MedBuddyBookingEvent = {
      id: `evt_${Date.now()}_1`,
      bookingId,
      eventType: 'BOOKING_CREATED',
      actorId: params.patientId,
      actorRole: 'patient',
      timestamp: nowIso,
      description: `MedBuddy companion booking created for ${params.destinationName}.`,
      metadata: {
        pickupAddress: params.pickupAddress,
        destinationName: params.destinationName,
        estimatedTotal: `${params.priceSnapshot.estimatedTotalMin}-${params.priceSnapshot.estimatedTotalMax}`,
      },
    };

    const newBooking: MedBuddyBooking = {
      id: bookingId,
      patientId: params.patientId,
      patientName: params.patientName,
      patientPhone: params.patientPhone,
      emergencyContactName: params.emergencyContactName,
      emergencyContactPhone: params.emergencyContactPhone,
      isForSelf: params.isForSelf,
      patientRelationship: params.patientRelationship,
      patientAge: params.patientAge,
      reasonCategory: params.reasonCategory,
      customReason: params.customReason,
      emergencyScreeningCleared: params.emergencyScreeningCleared,
      pickupAddress: params.pickupAddress,
      pickupCoordinates: params.pickupCoordinates,
      destinationPlaceId: params.destinationPlaceId,
      destinationName: params.destinationName,
      destinationAddress: params.destinationAddress,
      destinationCoordinates: params.destinationCoordinates,
      destinationPhone: params.destinationPhone,
      destinationMapsUrl: params.destinationMapsUrl,
      scheduledAt: params.scheduledAt,
      isAsap: params.isAsap,
      expectedHospitalDuration: params.expectedHospitalDuration,
      estimatedTotalDurationMinutes: params.estimatedTotalDurationMinutes,
      returnRequired: params.returnRequired,
      returnOption: params.returnOption,
      requestedServices: params.requestedServices,
      mobilityRequirement: params.mobilityRequirement,
      priceSnapshot: params.priceSnapshot,
      status: 'SEARCHING_FOR_BUDDY',
      assignedBuddyId: null,
      assignedBuddy: null,
      pickupPin,
      tasks: initialTasks,
      events: [initialEvent],
      cabStatus: 'FARE_ESTIMATED',
      paymentStatus: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const bookings = await this.getBookings();
    this.saveBookings([newBooking, ...bookings]);

    auditLogger.logAction(
      'MEDBUDDY_BOOKING_CREATED',
      `Booking ${bookingId} confirmed for patient ${params.patientName}`,
      { bookingId, patientId: params.patientId, destination: params.destinationName },
      'SUCCESS'
    );

    // Trigger automatic companion matching for ASAP requests
    if (params.isAsap) {
      setTimeout(async () => {
        await this.autoAssignMatchingBuddy(bookingId);
      }, 1200);
    }

    return newBooking;
  },

  /**
   * Auto-assign matching verified companion to booking
   */
  async autoAssignMatchingBuddy(bookingId: string): Promise<MedBuddyBooking | null> {
    const booking = await this.getBookingById(bookingId);
    if (!booking || booking.status !== 'SEARCHING_FOR_BUDDY') return null;

    const matchResult = await this.findBestMatchingBuddy(booking.pickupCoordinates);
    if (!matchResult) {
      console.warn(`[MedBuddy] No verified companion available for booking ${bookingId}`);
      return booking;
    }

    const { buddy } = matchResult;
    return this.assignBuddyToBooking(bookingId, buddy.id, 'system');
  },

  /**
   * Assign or Reassign MedBuddy to Booking
   */
  async assignBuddyToBooking(
    bookingId: string,
    buddyId: string,
    actorId = 'admin_ops',
    actorRole: 'admin' | 'system' = 'admin'
  ): Promise<MedBuddyBooking | null> {
    const booking = await this.getBookingById(bookingId);
    const buddy = await this.getBuddyById(buddyId);

    if (!booking || !buddy) return null;
    if (buddy.verificationStatus !== 'verified') {
      throw new Error('Only verified MedBuddies can be assigned to bookings.');
    }

    const nowIso = new Date().toISOString();
    const event: MedBuddyBookingEvent = {
      id: `evt_${Date.now()}_assign`,
      bookingId,
      eventType: 'BUDDY_ASSIGNED',
      actorId,
      actorRole,
      timestamp: nowIso,
      description: `MedBuddy ${buddy.name} assigned to booking.`,
      metadata: { buddyId: buddy.id, buddyName: buddy.name, rating: buddy.rating },
    };

    const updatedBooking: MedBuddyBooking = {
      ...booking,
      status: 'BUDDY_ASSIGNED',
      assignedBuddyId: buddy.id,
      assignedBuddy: buddy,
      events: [...booking.events, event],
      updatedAt: nowIso,
    };

    const bookings = await this.getBookings();
    this.saveBookings(bookings.map((b) => (b.id === bookingId ? updatedBooking : b)));

    auditLogger.logAction(
      'MEDBUDDY_ASSIGNED',
      `MedBuddy ${buddy.name} assigned to booking ${bookingId}`,
      { bookingId, buddyId: buddy.id },
      'SUCCESS'
    );

    return updatedBooking;
  },

  /**
   * Perform Secure State Machine Transition with validation
   */
  async transitionStatus(
    bookingId: string,
    newStatus: MedBuddyBookingStatus,
    actor: { id: string; role: 'patient' | 'buddy' | 'admin' | 'system'; name?: string },
    notes?: string
  ): Promise<MedBuddyBooking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }

    const currentStatus = booking.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: Cannot transition from "${currentStatus}" to "${newStatus}".`
      );
    }

    const nowIso = new Date().toISOString();
    const event: MedBuddyBookingEvent = {
      id: `evt_${Date.now()}_${newStatus}`,
      bookingId,
      eventType: `STATUS_${newStatus}`,
      actorId: actor.id,
      actorRole: actor.role,
      timestamp: nowIso,
      description: notes || `Booking transitioned to ${newStatus.replace(/_/g, ' ')}.`,
    };

    let updatedCabStatus = booking.cabStatus;
    if (newStatus === 'TRAVELLING_TO_HOSPITAL' || newStatus === 'RETURN_TRIP') {
      updatedCabStatus = 'RIDE_STARTED';
    } else if (newStatus === 'ARRIVED_AT_HOSPITAL' || newStatus === 'DROPPED_HOME' || newStatus === 'COMPLETED') {
      updatedCabStatus = 'RIDE_COMPLETED';
    }

    let updatedPaymentStatus = booking.paymentStatus;
    if (newStatus === 'COMPLETED' && booking.paymentStatus === 'pending') {
      // In test mode / cash fallback
      updatedPaymentStatus = 'test_mode';
    }

    const updatedBooking: MedBuddyBooking = {
      ...booking,
      status: newStatus,
      cabStatus: updatedCabStatus,
      paymentStatus: updatedPaymentStatus,
      events: [...booking.events, event],
      updatedAt: nowIso,
      cancelledAt: newStatus === 'CANCELLED' ? nowIso : booking.cancelledAt,
      cancelledBy: newStatus === 'CANCELLED' ? actor.role : booking.cancelledBy,
      cancellationReason: newStatus === 'CANCELLED' ? notes : booking.cancellationReason,
    };

    // If completed, increment buddy completed trips count
    if (newStatus === 'COMPLETED' && booking.assignedBuddyId) {
      const buddies = await this.getBuddies();
      const modifiedBuddies = buddies.map((b) => {
        if (b.id === booking.assignedBuddyId) {
          return { ...b, completedTrips: b.completedTrips + 1, currentAvailability: 'available' as const };
        }
        return b;
      });
      this.saveBuddies(modifiedBuddies);
    }

    const bookings = await this.getBookings();
    this.saveBookings(bookings.map((b) => (b.id === bookingId ? updatedBooking : b)));

    auditLogger.logAction(
      'MEDBUDDY_STATUS_TRANSITION',
      `Booking ${bookingId} transitioned from ${currentStatus} to ${newStatus}`,
      { bookingId, previousStatus: currentStatus, newStatus, actorRole: actor.role },
      'SUCCESS'
    );

    return updatedBooking;
  },

  /**
   * Verify Pickup PIN entered by MedBuddy
   */
  async verifyPickupPin(
    bookingId: string,
    enteredPin: string,
    buddyId: string
  ): Promise<{ success: boolean; message: string; booking?: MedBuddyBooking }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found.' };
    }

    if (booking.assignedBuddyId !== buddyId) {
      return { success: false, message: 'You are not the assigned companion for this booking.' };
    }

    if (booking.status !== 'BUDDY_ARRIVED') {
      return {
        success: false,
        message: 'Companion must mark arrived at pickup location before verifying PIN.',
      };
    }

    if (booking.pickupPin.trim() !== enteredPin.trim()) {
      return {
        success: false,
        message: 'Incorrect 4-digit PIN. Please ask the patient for the pickup PIN shown on their screen.',
      };
    }

    // Success -> Transition to PICKUP_CONFIRMED
    const updated = await this.transitionStatus(
      bookingId,
      'PICKUP_CONFIRMED',
      { id: buddyId, role: 'buddy' },
      'Patient 4-digit pickup PIN successfully verified by companion.'
    );

    return {
      success: true,
      message: 'Pickup verified successfully! You may now begin travel to the hospital.',
      booking: updated,
    };
  },

  /**
   * Toggle completion of a hospital companion task
   */
  async toggleTaskCompletion(
    bookingId: string,
    taskId: string,
    completed: boolean,
    buddyId: string
  ): Promise<MedBuddyBooking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const nowIso = new Date().toISOString();
    const updatedTasks = booking.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed,
          completedAt: completed ? nowIso : undefined,
          completedBy: completed ? buddyId : undefined,
        };
      }
      return t;
    });

    const updatedBooking: MedBuddyBooking = {
      ...booking,
      tasks: updatedTasks,
      updatedAt: nowIso,
    };

    const bookings = await this.getBookings();
    this.saveBookings(bookings.map((b) => (b.id === bookingId ? updatedBooking : b)));
    return updatedBooking;
  },

  /**
   * Submit Patient Rating & Review for Completed Booking
   */
  async submitRatingAndReview(
    bookingId: string,
    rating: number,
    feedback: string,
    patientId: string
  ): Promise<MedBuddyBooking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'COMPLETED') {
      throw new Error('Only completed companion trips can be rated.');
    }

    const nowIso = new Date().toISOString();
    const updatedBooking: MedBuddyBooking = {
      ...booking,
      rating,
      reviewFeedback: feedback.trim(),
      ratedAt: nowIso,
      updatedAt: nowIso,
    };

    // Update buddy average rating
    if (booking.assignedBuddyId) {
      const buddies = await this.getBuddies();
      const modifiedBuddies = buddies.map((b) => {
        if (b.id === booking.assignedBuddyId) {
          const currentTotal = b.rating * b.reviewCount;
          const newCount = b.reviewCount + 1;
          const newRating = Math.round(((currentTotal + rating) / newCount) * 10) / 10;
          return { ...b, rating: newRating, reviewCount: newCount };
        }
        return b;
      });
      this.saveBuddies(modifiedBuddies);
    }

    const bookings = await this.getBookings();
    this.saveBookings(bookings.map((b) => (b.id === bookingId ? updatedBooking : b)));

    auditLogger.logAction(
      'MEDBUDDY_RATED',
      `Booking ${bookingId} rated ${rating}/5 stars by patient ${patientId}`,
      { bookingId, rating, feedback },
      'SUCCESS'
    );

    return updatedBooking;
  },
};
