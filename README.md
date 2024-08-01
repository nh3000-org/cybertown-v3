homepage
- check if user is authenticated
  the app will be blank till the api call to /me route finishes
- establish websocket connection

Rooms
  - show loading
  - empty state

RoomCard
  - [x] show an alert when user tries to join room if not logged in
  - dynamic user spots sizing
  - when clicked on a user image, show user profile

CreateRoom
 - show loading status when form gets submitted
 - validate the fields and show error states
 - broadcast 'NEW_ROOM' 

custom scrollbar
