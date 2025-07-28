"use client";
import { useState } from 'react';
import { useGuestReservationLinking } from '@/hooks/useGuestReservationLinking';

export default function GuestReservationLinkingNotification() {
  const { 
    linkableReservations, 
    loading, 
    linkReservations, 
    dismissLinking, 
    hasLinkableReservations 
  } = useGuestReservationLinking();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  if (!hasLinkableReservations) {
    return null;
  }

  const handleLinkReservations = async () => {
    setIsProcessing(true);
    setMessage('');
    
    const success = await linkReservations();
    
    if (success) {
      setMessage(`Successfully linked ${linkableReservations.length} reservation${linkableReservations.length === 1 ? '' : 's'} to your account!`);
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } else {
      setMessage('Failed to link reservations. Please try again.');
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500/30 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        {message ? (
          <div className="text-center">
            <p className="text-green-300 font-medium">{message}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-300 text-lg">🔗</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Link Your Previous Reservations</h3>
                <p className="text-blue-200 text-sm">
                  We found {linkableReservations.length} reservation{linkableReservations.length === 1 ? '' : 's'} made with this email address. 
                  Would you like to link them to your new account?
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {linkableReservations.slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="bg-black/20 rounded p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{reservation.guest_name}</span>
                    <span className="text-blue-300">
                      {reservation.party_size} guest{reservation.party_size === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-blue-200 text-xs mt-1">
                    {new Date(reservation.datetime).toLocaleDateString()} at{' '}
                    {new Date(reservation.datetime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
              
              {linkableReservations.length > 3 && (
                <div className="text-center text-blue-300 text-sm">
                  +{linkableReservations.length - 3} more reservation{linkableReservations.length - 3 === 1 ? '' : 's'}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleLinkReservations}
                disabled={isProcessing || loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                {isProcessing ? 'Linking...' : 'Link Reservations'}
              </button>
              <button
                onClick={dismissLinking}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Not Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
