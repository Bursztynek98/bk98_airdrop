# BK98_AIRDROP
---
### This script allows you to create a realistic scene of a cargo drop from an aircraft. 

The script performs the following steps:

1. Creates an airplane with a load in a specific position and direction of flight. The position of the plane is synchronized using the server clock, so every player sees it in the same place.
2. The plane flies to the drop location, which is predetermined or randomly selected by the server.
3. A package suspended by a parachute appears and falls to the ground. The package has a flare effect that lights up and smokes, making it easy to locate. The package's position is also synchronized using the server's clock, so every player sees it in the same place.
4. The package waits on the ground for a certain amount of time, such as 10 minutes. After that time, the script removes the package.

This script is ideal for simulating rescue missions, delivering supplies or creating surprises for players.

---

# Pre-requisites
- Install [Node.js](https://nodejs.org/en/) (v20.x)
- or Fivem Node.js (16.x)

# Getting started
- Clone the repository
```bash
git clone https://github.com/Bursztynek98/bk98_airdrop.git
```
- Install dependencies
```bash
cd bk98_airdrop
yarn install
```
- Build and run the project
```bash
npm run build
```
- Add script to server
```
ensure bk98_airdrop
```
---
# Client Events

### AIRCRAFT_EVENT_NAME
`BK98_AIRDROP:AIRCRAFT_EVENT_NAME:SPAWN`
```json
id: string,
vehicle: number,
ped: number,
realFinish: boolean
metaData: any
```
realFinish ? means that the plane has reached its destination

`BK98_AIRDROP:AIRCRAFT_EVENT_NAME:DELETE`
```json
id: string,
vehicle: number,
ped: number,
metaData: any
```
`BK98_AIRDROP:AIRCRAFT_EVENT_NAME:START`
```json
id: string,
metaData: any
```
`BK98_AIRDROP:AIRCRAFT_EVENT_NAME:UPDATE_POSITION`
```json
id: string,
vehicle: number | undefined | null,
ped: number | undefined | null,
cord: [x: number, y: number, z: number]
realFinish: boolean
metaData: any
```
cord ? index from 0


### PROP_EVENT_NAME

`BK98_AIRDROP:PROP_EVENT_NAME:SPAWN`
```json
id: string,
object: number,
parachute: number | undefined | null,
realFinish: boolean
metaData: any
```
realFinish ? means that the plane has reached its destination

`BK98_AIRDROP:PROP_EVENT_NAME:DELETE`
```json
id: string,
object: number | undefined | null,
parachute: number | undefined | null,
metaData: any
```
`BK98_AIRDROP:PROP_EVENT_NAME:START`
```json
id: string,
metaData: any
```
`BK98_AIRDROP:PROP_EVENT_NAME:UPDATE_POSITION`
```json
id: string,
object: number | undefined | null,
parachute: number | undefined | null,
cord: [x: number, y: number, z: number]
realFinish: boolean
metaData: any
```
cord ? index from 0

---

# Server Export

`ADD_DROP`
```
input:
  [x, y]: [number, number],
  aircraft: {
    model: string;
    visibleRadius?: number;
    pilotModel?: string | number;
  },
  prop: {
    model: string;
    visibleRadius?: number;
    speed?: number;
    disappearTime?: number;
    z?: number;
  },
  metaData?: Record<string, any>,
  distance = 6000,
  height = 300.0,
  heading?: number,
output:
  string
```


`REMOVE_DROP`

```
input:
  id: string
output:
  void
```

---
# Common Issues
- The default flight altitude of the aircraft is 300 meters up, which provides optimal effect on almost the entire map. However, if the plane is to fly over the mount chiliad the altitude must be set to a minimum of 600

---
# Example
- `example/client/blip.lua` - For Create blip of Aircraft
- `example/client/notification.lua` - For Create notification when create package and aircraft
- `example/client/target.lua` - For add target `ox_target` and open inventory `ox_inventory`
- `example/server/main.lua` - For Create Temporary Stash and Airdrop for x=0, y=0