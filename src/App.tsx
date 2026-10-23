import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import { BusPreloader } from './components/motion/BusPreloader';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { AnimatedBusHero } from './components/home/AnimatedBusHero';
import { FeaturedRoutes } from './components/home/FeaturedRoutes';
import { VehicleExperience } from './components/home/VehicleExperience';
import { BookingSteps } from './components/home/BookingSteps';
import { BenefitsSection } from './components/home/BenefitsSection';
import { FaqSection } from './components/home/FaqSection';
import { TripResultsView } from './components/search/TripResultsView';
import type { Booking, BookingStep, PassengerInfo, SearchParams, Seat, Trip } from './types';
import { bookingService } from './services/bookingService';
import { VEHICLE_MODELS } from './data/mockData';
import { preloadCriticalHeroAssets } from './data/sceneData';
import { getVietnamTodayDateStr, isValidBookingDate } from './utils/dateUtils';

// Code-split dynamic booking steps and ticket lookup to optimize initial bundle
const SeatSelectionModal = React.lazy(() =>
  import('./components/seats/SeatSelectionModal').then((m) => ({ default: m.SeatSelectionModal }))
);
const PassengerForm = React.lazy(() =>
  import('./components/checkout/PassengerForm').then((m) => ({ default: m.PassengerForm }))
);
const DemoPayment = React.lazy(() =>
  import('./components/checkout/DemoPayment').then((m) => ({ default: m.DemoPayment }))
);
const BoardingTicket = React.lazy(() =>
  import('./components/tickets/BoardingTicket').then((m) => ({ default: m.BoardingTicket }))
);
const TicketLookupView = React.lazy(() =>
  import('./components/tickets/TicketLookupView').then((m) => ({ default: m.TicketLookupView }))
);

export const App: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // 3-Stage Lifecycle for realistic loading & synchronized hero entrance:
  // 1. criticalAssetsReady: Default vehicle & initial route scenes loaded & decoded
  // 2. loaderExitComplete: Preloader has fully faded out and unmounted
  // 3. heroIntroReady: Signal for hero bus to begin smooth entrance
  const [criticalAssetsReady, setCriticalAssetsReady] = useState(false);
  const [loaderExitComplete, setLoaderExitComplete] = useState(false);
  const [heroIntroReady, setHeroIntroReady] = useState(false);

  // Navigation Step with URL restoration support
  const [currentStep, setCurrentStep] = useState<BookingStep>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const step = urlParams.get('step');
      if (step === 'search') return 'search';
      if (step === 'lookup') return 'lookup';
    }
    return 'home';
  });

  // Booking Flow States with safe URL restoration and strict validation
  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    const today = getVietnamTodayDateStr();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const rawFrom = urlParams.get('from')?.trim();
      const rawTo = urlParams.get('to')?.trim();
      const rawDate = urlParams.get('date')?.trim();
      const rawPassengers = urlParams.get('passengers')?.trim();

      const validDate = isValidBookingDate(rawDate) ? (rawDate as string) : today;
      let validPassengers = 1;
      if (rawPassengers) {
        const parsed = parseInt(rawPassengers, 10);
        if (!isNaN(parsed)) {
          validPassengers = Math.min(5, Math.max(1, parsed));
        }
      }

      if (rawFrom || rawTo) {
        const from = rawFrom || 'Đà Nẵng';
        const to = rawTo || (from === 'Huế' ? 'Đà Nẵng' : 'Huế');
        return {
          from,
          to,
          date: validDate,
          passengers: validPassengers,
        };
      }
    }
    return {
      from: 'Đà Nẵng',
      to: 'Huế',
      date: today,
      passengers: 1,
    };
  });

  const [availableTrips, setAvailableTrips] = useState<Trip[]>(() => {
    return bookingService.searchTrips(searchParams);
  });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const initialParamsRef = useRef({ from: searchParams.from, to: searchParams.to });

  // Parallel preload critical hero assets immediately on mount
  useEffect(() => {
    let isMounted = true;
    const defaultVehicle = VEHICLE_MODELS['limousine']?.image || VEHICLE_MODELS['sleeper']?.image || '';
    const { from, to } = initialParamsRef.current;

    // Fast safety timeout to avoid hanging indefinitely
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setCriticalAssetsReady(true);
      }
    }, 1200);

    preloadCriticalHeroAssets(from, to, defaultVehicle)
      .then(() => {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setCriticalAssetsReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setCriticalAssetsReady(true);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []); // Run strictly once on initial mount

  const handleLoaderExitComplete = () => {
    setLoaderExitComplete(true);
    // Trigger hero bus entrance smoothly as soon as preloader finishes exit
    setHeroIntroReady(true);
  };

  // Sync search params to URL query string without reloading
  const updateUrlParams = (params: SearchParams, step?: BookingStep) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('from', params.from);
      url.searchParams.set('to', params.to);
      url.searchParams.set('date', params.date);
      url.searchParams.set('passengers', params.passengers.toString());
      if (step && step !== 'home') {
        url.searchParams.set('step', step);
      } else if (step === 'home') {
        url.searchParams.delete('step');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  }, [currentStep, shouldReduceMotion]);

  // Handle Search Submission
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    updateUrlParams(params, 'search');
    const results = bookingService.searchTrips(params);
    setAvailableTrips(results);
    setCurrentStep('search');
  };

  // Handle Select Trip from Search Results
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    // Reset seat selection completely on trip select to ensure clean state
    setSelectedSeats([]);
    setCurrentStep('seat-select');
  };

  // Handle Seat Toggle with strict limit checking
  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'disabled') return;

    if (selectedSeats.includes(seat.code)) {
      setSelectedSeats(selectedSeats.filter((c) => c !== seat.code));
    } else {
      // Do NOT replace the last seat if limit is reached - preserve user selection
      if (selectedSeats.length < searchParams.passengers) {
        setSelectedSeats([...selectedSeats, seat.code]);
      }
    }
  };

  const handleRemoveSeat = (code: string) => {
    setSelectedSeats(selectedSeats.filter((c) => c !== code));
  };

  // Handle Passenger Form Submission
  const handlePassengerSubmit = (info: PassengerInfo) => {
    setPassengerInfo(info);
    setCurrentStep('payment');
  };

  // Handle Payment Simulation
  const handlePaymentSuccess = (paymentMethod: 'vietqr' | 'momo' | 'vnpay' | 'credit_card') => {
    if (!selectedTrip || !passengerInfo) return;

    const newBooking: Booking = {
      id: bookingService.generateBookingCode(),
      tripId: selectedTrip.id,
      trip: selectedTrip,
      date: searchParams.date,
      selectedSeats,
      passenger: passengerInfo,
      totalAmount: selectedSeats.length * selectedTrip.price,
      paymentMethod,
      paymentStatus: 'completed',
      createdAt: new Date().toISOString(),
    };

    bookingService.saveBooking(newBooking);
    setCompletedBooking(newBooking);
    setCurrentStep('success');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F7F4EC] text-[#102744]">
      {/* 01: Mandatory Real Bus Running Preloader with real asset synchronization */}
      {!loaderExitComplete && (
        <BusPreloader
          isReady={criticalAssetsReady}
          onExitComplete={handleLoaderExitComplete}
          maxTimeoutMs={3500}
        />
      )}

      {/* Main Web Application (seamlessly ready as preloader starts exit) */}
      <div
        className={`flex-1 flex flex-col transition-opacity duration-300 ${
          criticalAssetsReady || loaderExitComplete ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Site Header */}
        <SiteHeader
          currentTab={currentStep}
          variant={currentStep === 'home' ? 'default' : 'compact'}
          onNavigate={(tab) => {
            if (tab === 'home') setCurrentStep('home');
            else if (tab === 'search') setCurrentStep('search');
            else if (tab === 'routes') {
              setCurrentStep('home');
              setTimeout(() => {
                document.getElementById('routes-section')?.scrollIntoView({
                  behavior: shouldReduceMotion ? 'auto' : 'smooth',
                });
              }, 100);
            } else if (tab === 'experience') {
              setCurrentStep('home');
              setTimeout(() => {
                document.getElementById('experience-section')?.scrollIntoView({
                  behavior: shouldReduceMotion ? 'auto' : 'smooth',
                });
              }, 100);
            }
          }}
          onOpenLookup={() => setCurrentStep('lookup')}
        />

        {/* View Router Switcher */}
        <main className="flex-1">
          <Suspense fallback={<div className="min-h-screen bg-[#F7F4EC]" />}>
            <AnimatePresence mode="wait">
            {/* Step: Home Page */}
            {currentStep === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.25 }}
              >
                <AnimatedBusHero
                  initialParams={searchParams}
                  onSearch={handleSearch}
                  isSearching={false}
                  introReady={heroIntroReady}
                />
                <FeaturedRoutes
                  onSelectRoute={(from, to) => {
                    handleSearch({
                      from,
                      to,
                      date: searchParams.date,
                      passengers: searchParams.passengers,
                    });
                  }}
                />
                <VehicleExperience />
                <BookingSteps />
                <BenefitsSection />
                <FaqSection />
              </motion.div>
            )}

            {/* Step: Trip Search Results */}
            {currentStep === 'search' && (
              <motion.div
                key="search"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.25 }}
              >
                <TripResultsView
                  searchParams={searchParams}
                  allTrips={availableTrips}
                  onSelectTrip={handleSelectTrip}
                  onModifySearch={() => {
                    setCurrentStep('home');
                    updateUrlParams(searchParams, 'home');
                  }}
                />
              </motion.div>
            )}

            {/* Step: Seat Selection */}
            {currentStep === 'seat-select' && selectedTrip && (
              <motion.div
                key="seat-select"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.25 }}
              >
                <SeatSelectionModal
                  trip={selectedTrip}
                  dateStr={searchParams.date}
                  passengersCount={searchParams.passengers}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleToggleSeat}
                  onRemoveSeatCode={handleRemoveSeat}
                  onBack={() => setCurrentStep('search')}
                  onProceedToPassenger={() => setCurrentStep('passenger-info')}
                />
              </motion.div>
            )}

            {/* Step: Passenger Info */}
            {currentStep === 'passenger-info' && selectedTrip && (
              <motion.div
                key="passenger-info"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.25 }}
              >
                <PassengerForm
                  trip={selectedTrip}
                  dateStr={searchParams.date}
                  selectedSeats={selectedSeats}
                  initialPassenger={passengerInfo || undefined}
                  onBack={() => setCurrentStep('seat-select')}
                  onSubmit={handlePassengerSubmit}
                />
              </motion.div>
            )}

            {/* Step: Demo Payment */}
            {currentStep === 'payment' && selectedTrip && passengerInfo && (
              <motion.div
                key="payment"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.25 }}
              >
                <DemoPayment
                  trip={selectedTrip}
                  dateStr={searchParams.date}
                  selectedSeats={selectedSeats}
                  passenger={passengerInfo}
                  onBack={() => setCurrentStep('passenger-info')}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </motion.div>
            )}

            {/* Step: Booking Success Boarding Ticket */}
            {currentStep === 'success' && completedBooking && (
              <motion.div
                key="success"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.3 }}
              >
                <BoardingTicket
                  booking={completedBooking}
                  onNavigateHome={() => setCurrentStep('home')}
                  onOpenLookup={() => setCurrentStep('lookup')}
                />
              </motion.div>
            )}

            {/* Step: Ticket Lookup */}
            {currentStep === 'lookup' && (
              <motion.div
                key="lookup"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0.04 : 0.25 }}
              >
                <TicketLookupView
                  initialBookingCode={completedBooking?.id}
                  onBack={() => setCurrentStep('home')}
                  onNavigateHome={() => setCurrentStep('home')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>

        {/* Site Footer */}
        <SiteFooter
          onSelectRoute={(from, to) => {
            handleSearch({
              from,
              to,
              date: searchParams.date,
              passengers: searchParams.passengers,
            });
          }}
          onOpenLookup={() => setCurrentStep('lookup')}
        />
      </div>
    </div>
    </MotionConfig>
  );
};

export default App;
