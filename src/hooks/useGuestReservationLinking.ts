"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

export function useGuestReservationLinking() {
  const { user, profile } = useAuth();
  const [linkableReservations, setLinkableReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check for linkable reservations when user signs in
  useEffect(() => {
    if (user && user.email && !hasChecked) {
      checkForLinkableReservations();
    }
  }, [user, hasChecked]);

  const checkForLinkableReservations = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_linkable_reservations', { user_email: user.email });

      if (error) {
        console.error('Error checking linkable reservations:', error);
        // If the function doesn't exist yet, just skip silently
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          console.log('Guest reservation linking not yet set up in database');
        }
      } else {
        setLinkableReservations(data || []);
      }
    } catch (err) {
      console.error('Error in checkForLinkableReservations:', err);
      // Don't throw errors to the UI for this optional feature
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  const linkReservations = async () => {
    if (!user?.id || !user?.email) return false;

    setLoading(true);
    try {
      const { data: linkedCount, error } = await supabase
        .rpc('admin_link_guest_reservations', {
          user_email: user.email,
          target_user_id: user.id
        });

      if (error) {
        console.error('Error linking reservations:', error);
        return false;
      }

      // Clear the linkable reservations since they've been linked
      setLinkableReservations([]);
      return true;
    } catch (err) {
      console.error('Error in linkReservations:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissLinking = () => {
    setLinkableReservations([]);
  };

  return {
    linkableReservations,
    loading,
    linkReservations,
    dismissLinking,
    hasLinkableReservations: linkableReservations.length > 0
  };
}
