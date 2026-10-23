import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { SeatSelectionModal } from './components/seats/SeatSelectionModal';
import { PassengerForm } from './components/checkout/PassengerForm';
import { DemoPayment } from './components/checkout/DemoPayment';
import { BoardingTicket } from './components/tickets/BoardingTicket';
import { TicketLookupView } from './components/tickets/TicketLookupView';
import type { Booking, BookingStep, PassengerInfo, SearchParams, Seat, Trip } from './types';
import { bookingService } from './services/bookingService';
import { MOCK_TRIPS } from './data/mockData';

export const App: React.FC = () => {
  // Preloader state
  const [appReady, setAppReady] = useState(false);

  // Navigation Step
  const [currentStep, setCurrentStep] = useState<BookingStep>('home');

  // Booking Flow States with URL restoration support
  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const from = urlParams.get('from');
      const to = urlParams.get('to');
      const date = urlParams.get('date');
      const passengers = urlParams.get('passengers');
      if (from || to) {
        return {
          from: from || 'Đà Nẵng',
          to: to || 'Huế',
          date: date || '2026-10-28',
          passengers: passengers ? Math.max(1, parseInt(passengers, 10) || 1) : 1,
        };
      }
    }
    return {
      from: 'Đà Nẵng',
      to: 'Huế',
      date: '2026-10-28',
      passengers: 1,
    };
  });

  const [availableTrips, setAvailableTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Sync search params to URL query string without reloading
  const updateUrlParams = (params: SearchParams) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('from', params.from);
      url.searchParams.set('to', params.to);
      url.searchParams.set('date', params.date);
      url.searchParams.set('passengers', params.passengers.toString());
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Handle Search Submission
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    updateUrlParams(params);
    const results = bookingService.searchTrips(params);
    setAvailableTrips(results.length > 0 ? results : MOCK_TRIPS);
    setCurrentStep('search');
  };

  // Handle Select Trip from Search Results
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    // Pre-select first available seats according to passenger count for ease of demo, or reset
    const availableCodes = trip.seats
      .filter((s) => s.status === 'available')
      .slice(0, searchParams.passengers)
      .map((s) => s.code);

    setSelectedSeats(availableCodes);
    setCurrentStep('seat-select');
  };

  // Handle Seat Toggle
  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === 'booked') return;

    if (selectedSeats.includes(seat.code)) {
      setSelectedSeats(selectedSeats.filter((c) => c !== seat.code));
    } else {
      if (selectedSeats.length < searchParams.passengers) {
        setSelectedSeats([...selectedSeats, seat.code]);
      } else {
        // Replace last seat if limit reached
        setSelectedSeats([...selectedSeats.slice(0, -1), seat.code]);
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
    <div className="min-h-screen flex flex-col bg-[#F7F4EC] text-[#102744]">
      {/* 01: Mandatory Real Bus Running Preloader */}
      {!appReady && (
        <BusPreloader onComplete={() => setAppReady(true)} minDuration={1400} />
      )}

      {/* Main Web Application (fades in once loader completes) */}
      <div className={`flex-1 flex flex-col transition-opacity duration-500 ${appReady ? 'opacity-100' : 'opacity-0'}`}>
        {/* Site Header */}
        <SiteHeader
          currentTab={currentStep}
          onNavigate={(tab) => {
            if (tab === 'home') setCurrentStep('home');
            else if (tab === 'search') setCurrentStep('search');
            else if (tab === 'routes') {
              setCurrentStep('home');
              setTimeout(() => {
                document.getElementById('routes-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else if (tab === 'experience') {
              setCurrentStep('home');
              setTimeout(() => {
                document.getElementById('experience-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }}
          onOpenLookup={() => setCurrentStep('lookup')}
        />

        {/* View Router Switcher */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {/* Step: Home Page */}
            {currentStep === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <AnimatedBusHero
                  initialOrigin={searchParams.from}
                  initialDest={searchParams.to}
                  onSearch={handleSearch}
                  isSearching={false}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <TripResultsView
                  searchParams={searchParams}
                  allTrips={availableTrips}
                  onSelectTrip={handleSelectTrip}
                  onModifySearch={() => setCurrentStep('home')}
                />
              </motion.div>
            )}

            {/* Step: Seat Selection */}
            {currentStep === 'seat-select' && selectedTrip && (
              <motion.div
                key="seat-select"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <TicketLookupView
                  onBack={() => setCurrentStep('home')}
                  onNavigateHome={() => setCurrentStep('home')}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
  );
};

export default App;
