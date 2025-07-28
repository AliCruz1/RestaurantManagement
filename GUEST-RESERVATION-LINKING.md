# Guest Reservation Account Linking System

This system automatically links guest reservations to user accounts when someone creates an account using the same email address, providing a seamless upgrade path from guest to registered user.

## How It Works

### 1. Database Functions (`guest-account-linking.sql`)
- **`link_guest_reservations_to_user()`**: Trigger function that automatically links guest reservations when a new profile is created
- **`admin_link_guest_reservations()`**: Manual function for admins to link reservations
- **`get_linkable_reservations()`**: Utility function to find reservations that can be linked

### 2. Automatic Linking Process
When a user creates a new account:
1. The system searches for guest reservations with the same email address
2. Automatically transfers the data from guest fields to user fields
3. Links the reservations to the new user account
4. Clears the guest fields to avoid duplication

### 3. User Interface Components

#### `useGuestReservationLinking.ts` Hook
- Detects linkable reservations for signed-in users
- Provides functions to link or dismiss reservations
- Manages loading states and error handling

#### `GuestReservationLinkingNotification.tsx` Component
- Shows a beautiful notification when linkable reservations are found
- Displays reservation details before linking
- Allows users to link or dismiss the suggestions
- Positioned as a non-intrusive overlay

### 4. User Experience Flow

#### For New Users:
1. Guest makes reservations → Gets email confirmations
2. Later creates account with same email → Sees signup message about auto-linking
3. Signs in → Gets notification showing linkable reservations
4. Clicks "Link Reservations" → All previous guest bookings are now in their account

#### For Returning Users:
- The system only shows the notification once per session
- Users can dismiss the notification if they prefer to keep reservations separate
- Linked reservations appear in their account immediately

## Features

### Automatic Detection
- Runs automatically when users sign in
- Only shows notification if linkable reservations exist
- Handles edge cases like cancelled or expired reservations

### Data Integrity
- Preserves all reservation data during linking
- Maintains reservation tokens for continued email access
- Updates database relationships correctly

### User Control
- Users can choose to link or dismiss
- Clear visibility of what will be linked
- Non-blocking and optional process

### Security
- Only links reservations with exact email matches
- Requires user authentication before linking
- Preserves guest access via original reservation tokens

## Database Schema Changes

### New Columns Added:
- `reservations.reservation_token` (for email-based access)

### New Functions:
- `link_guest_reservations_to_user()` - Auto-linking trigger
- `admin_link_guest_reservations()` - Manual admin linking
- `get_linkable_reservations()` - Find linkable reservations

### New Policies:
- Enhanced RLS policies for linked reservations
- Token-based access for guest reservations

## Benefits

1. **Seamless Upgrade Path**: Guests can easily transition to accounts without losing history
2. **Improved User Experience**: No need to re-enter reservation details
3. **Better Customer Retention**: Users see immediate value in creating accounts
4. **Reduced Support Requests**: Automatic process eliminates manual linking requests
5. **Data Consistency**: All reservations in one place for registered users

## Implementation Notes

- The linking process is non-destructive and reversible
- Guest access via email links continues to work even after linking
- The system handles both individual and bulk reservation linking
- All existing reservation management features work with linked reservations

## Future Enhancements

- Admin interface for manual reservation linking
- Bulk linking tools for migrating historical data
- Enhanced user notifications for successful linking
- Reservation history analytics for linked accounts
