// The real size of every thing in the object library, against an adult standing beside it (1 = about 1.7 m): its height
// "h" and its length "l" (side view), where it is ("ground", "air", "water", "held" in a hand, "wall" a line along the
// ground) and the poses it may be drawn in. One source for the scene prompt, the server's size check, the scene engine
// (old scenes are put right with it on display) and the drawing kit. Written as "id h l" lines per family (l left out =
// as long as tall); the family gives the place, a line may name its own after a third number.
export type MotionObjectPlace = "ground" | "air" | "water" | "held" | "wall";
export type MotionObjectSize = { h: number; l: number; place: MotionObjectPlace; poses?: readonly string[] };

const table = (place: MotionObjectPlace, rows: string): [string, MotionObjectSize][] =>
  rows
    .trim()
    .split(/\s*,\s*/)
    .map((row) => {
      const [id, h, l, own] = row.trim().split(/\s+/);
      return [id, { h: +h, l: l != null && l !== "-" ? +l : +h, place: (own as MotionObjectPlace) || place }];
    });

const VEHICLES = [
  ...table("ground", `
    wagon 0.85 2.4, chariot 0.75 1.6, catapult 1.2 2.2, trebuchet 2.6 3, cannon 0.7 1.6, artillery 0.9 2.4, howitzer 1.1 3.2, bombard 0.6 1.8,
    siegeMortar 0.7 1.2, fieldGun 0.9 2.4, antiTankGun 0.9 2.6, antiAircraftGun 1.2 2.4, rocketArtillery 1.6 4.2, siegeTower 5 2.4, ballista 0.9 1.6,
    siegeLadder 3 0.5, mantlet 1.2 1.4, supplyCart 0.8 2, train 2.2 6, steamTrain 2.4 12, subwayTrain 2 12, tram 2 8, bicycle 0.6 1, motorbike 0.65 1.2,
    sidecar 0.65 1.4, scooter 0.65 1.1, car 0.85 2.6, classicCar 0.85 2.6, taxi 0.85 2.6, police 0.85 2.7, vintageTaxi 0.95 2.4, vintagePolice 0.95 2.5,
    jeep 1 2.2, pickupTruck 1.1 3.1, truck 1.7 4.4, semiTruck 2.4 9, bus 1.8 7, vintageBus 1.8 5.5, horseBus 1.6 4.5, ambulance 1.5 3.4, fireTruck 1.8 5,
    tank 1.4 4.3, tankModern 1.4 5.5, apc 1.4 4, armoredCar 1.3 3.2, halftrack 1.3 3.6, tractor 1.6 2.4, combineHarvester 2.2 5.5, bulldozer 1.9 3.6,
    constructionCrane 12 6, excavator 1.9 5, rickshaw 0.9 1.6, cyclo 0.9 1.6, oxCart 0.9 2.6, bullockWagon 1 3, horseCarriage 1.1 2.8, hansomCab 1.3 2.6,
    dogSled 0.6 2.4, camelCaravan 1.3 6, elephantHowdah 2.4 2.6
  `),
  ...table("water", `
    raft 0.15 2, bambooRaft 1.1 2.6, canoe 0.45 2.6, rowboat 0.45 2.5, basketBoat 0.35 1.1, sampan 0.6 4, boat 0.7 4, dragonBoat 1 9, speedboat 0.7 4.4,
    patrolBoat 1.6 11, ferry 2.4 12, longship 7 13, trireme 8 20, junk 9 14, cog 10 12, caravel 12 12, galleon 18 22, ship 14 26, warship 14 30,
    shipOfTheLine 30 34, turtleShip 2.2 20, ironclad 3 30, gunboat 3 18, landingCraft 1.6 9, carrier 14 150, containerShip 18 120, submarine 4.5 50
  `),
  ...table("air", `
    balloon 9 7, airship 10 70, biplane 1.7 4.3, plane 2.2 5.5, fighter 2.6 9, bomber 3.5 14, jet 3 10, airliner 7 35, transportPlane 6 24,
    helicopter 2.3 10, attackHelicopter 2.3 10, rocket 1.2 9, missile 0.5 3.5, drone 0.15 0.4
  `),
];
const BUILDINGS = table("ground", `
  house 2.2 2.4, cottage 2 2.6, hut 1.6 1.8, stiltHouse 2.6 3, longhouse 2.2 6, yurt 1.5 2.4, tent 1.5 2.4, campTent 1.1 1.8, hideTent 1.2 1.8,
  pavilionTent 1.6 2.4, domeTent 1.2 1.8, fieldHospitalTent 1.8 3.6, church 4 3.4, cathedral 9 7, temple 4 4.4, pagoda 6 2.4, mosque 5 4.4, stupa 4 3,
  torii 2.6 2.8, ziggurat 6 9, pyramid 9 14, castle 5 7, palace 5 9, imperialPalace 5 11, tower 4.5 1.4, watchtower 4 1.4, lighthouse 7 1.6, waterTower 6 2,
  gatehouse 3.4 3, cityGate 4 4.8, stockadeGate 2.6 2.6, hillFort 3 9, barn 2.6 3.4, windmill 4 2, factory 6 7, powerPlant 6 10, warehouse 3.4 6,
  skyscraper 20 6, apartmentBlock 9 7, townhouse 4 2, shophouse 3.6 2, tubeHouse 4.4 1.6, frenchVilla 3.6 4, romanVilla 2.6 6, insula 6 5,
  halfTimberHouse 3.4 3, adobeHouse 1.8 2.4, mudHouse 1.6 2, logCabin 2 3, igloo 1.2 1.8, machiya 2.6 3, siheyuan 2.4 6, hanok 2.4 4, communalHouse 4 7,
  stall 1.6 1.7, marketHall 3 7, inn 3 4, teahouse 2.4 3, school 3.4 6, hospital 4 8, railwayStation 4 9, bank 4 4, townHall 4.6 6, prison 3.4 7,
  dock 0.9 6, oilRig 9 6, oilDerrick 6 1.6, bunker 1.4 3, trench 0.6 4, ruins 2 3.6, amphitheater 4 12, aqueduct 6 12, cave 2.4 3, caveMouth 2.4 3,
  mountain 30 40, volcano 30 45, waterfall 6 4, karst 14 8, glacier 12 30, dunes 4 20, riceTerraces 4 14, cliff 8 10, villageCluster 2.6 8,
  shipyardHull 3 9, wreckedTank 1.3 4.3
`);
const ANIMALS = [
  ...table("ground", `
    horse 0.95 1.4, warHorse 1 1.5, packHorse 0.9 1.4, mule 0.85 1.3, donkey 0.75 1.1, ox 0.85 1.5, oxTeam 0.85 3.2, cow 0.8 1.4, buffalo 0.85 1.6,
    yak 0.9 1.4, bison 1 1.7, camel 1.2 1.6, llama 1 0.9, elephant 1.8 2.5, giraffe 2.8 1.6, hippo 0.85 2.2, rhino 0.95 2.2, zebra 0.8 1.3,
    deer 0.75 1, reindeer 0.75 1.1, moose 1.2 1.6, dog 0.4 0.55, wolf 0.45 0.75, fox 0.25 0.5, sheep 0.45 0.65, goat 0.45 0.6, pig 0.4 0.7,
    boar 0.45 0.8, tiger 0.6 1.6, lion 0.65 1.5, leopard 0.45 1.2, bear 0.75 1.2, panda 0.5 0.9, gorilla 0.9 0.8, monkey 0.35 0.3, kangaroo 0.9 0.7,
    cat 0.15 0.3, rat 0.05 0.12, rabbit 0.15 0.25, squirrel 0.1 0.2, chicken 0.18 0.2, rooster 0.2 0.22, duck 0.18 0.25, goose 0.28 0.35,
    peacock 0.4 1.1, crane 0.6 0.6, crocodile 0.25 2.5, turtle 0.1 0.3, crab 0.04 0.1, snake 0.08 0.9, frog 0.04 0.06, lizard 0.04 0.15
  `),
  ...table("air", `
    dove 0.1 0.18, crow 0.12 0.25, eagle 0.35 0.5, vulture 0.4 0.6, owl 0.25 0.15, parrot 0.2 0.18, seagull 0.1 0.7, bat 0.05 0.25, butterfly 0.03 0.04,
    beeSwarm 0.4 0.6, mosquito 0.01 0.01, locustSwarm 1.5 3
  `),
  ...table("water", `fishSchool 0.4 1.2, shark 0.5 2.4, whale 2 9, dolphin 0.35 1.4`),
];
const TREES = table("ground", `
  oak 3 2.4, pine 3.2 1.4, fir 3.4 1.4, birch 2.8 1.2, willow 2.8 2.6, cypress 3 0.8, cherry 2.4 2.2, fruit 2.4 2, olive 2.2 2.4, maple 3 2.4,
  palm 3 1.6, coconut 3.4 1.6, banana 2.2 1.6, bamboo 2.6 1, banyan 3.4 4, baobab 3.6 3, acacia 2.8 3.4, mangrove 1.8 2.4, cactus 1.2 0.6,
  dead 2.4 1.8, bush 0.7 1, sugarcane 1.6 0.8, teaBush 0.6 0.8, vine 1.2 1, lotusPlant 0.3 0.6
`);
const WALLS = table("wall", `bridge 0.6 -, palisade 1.4 -, wall 2 -, gate 2.2 2, fence 0.55 -, wagonFort 0.85 -, sandbags 0.5 -, barbedWire 0.5 -, earthwork 0.6 -, stakeRow 0.65 -`);
const PROPS = [
  // Held in a hand: weapons, tools, small things (length along the thing).
  ...table("held", `
    spear 1.3 0.05, javelin 1.1 0.04, pilum 1.2 0.05, lance 1.9 0.06, pike 2.6 0.06, halberd 1.3 0.1, naginata 1.3 0.08, guandao 1.3 0.1, trident 1.1 0.15,
    staff 1.1 0.05, bow 0.75 0.2, longbow 1.1 0.2, compositeBow 0.7 0.2, crossbow 0.45 0.55, arrows 0.45 0.1, quiver 0.45 0.12, sword 0.55 0.1,
    longsword 0.65 0.12, greatsword 0.8 0.15, gladius 0.4 0.06, khopesh 0.35 0.12, falchion 0.45 0.1, scimitar 0.5 0.1, sabre 0.55 0.1, katana 0.6 0.06,
    dao 0.55 0.1, dagger 0.18 0.04, axe 0.45 0.15, stoneAxe 0.35 0.12, mace 0.4 0.1, morningstar 0.45 0.15, flail 0.45 0.15, warhammer 0.5 0.12,
    club 0.45 0.08, sling 0.4 0.05, arquebus 0.8 0.12, musket 0.9 0.1, rifle 0.75 0.1, carbine 0.6 0.1, boltRifle 0.75 0.1, bayonet 0.2 0.03,
    pistol 0.12 0.15, revolver 0.12 0.15, submachineGun 0.4 0.15, machineGun 0.7 0.2, assaultRifle 0.55 0.15, handCannon 0.6 0.08,
    grenade 0.05 0.05, stickGrenade 0.2 0.04, rocketLauncher 0.65 0.12, flamethrower 0.7 0.3, roundShield 0.5 0.5, kiteShield 0.6 0.35,
    heaterShield 0.45 0.35, scutum 0.6 0.4, hopliteShield 0.5 0.5, rattanShield 0.5 0.5, horn 0.15 0.2, banner 1.8 0.6, signalFlag 0.6 0.3,
    torch 0.4 0.08, lantern 0.2 0.12, candle 0.1 0.03, oilLamp 0.06 0.1, hammer 0.18 0.1, mallet 0.2 0.12, whetstone 0.05 0.12, sickle 0.25 0.2,
    scythe 1.1 0.5, hoe 0.9 0.15, pitchfork 1 0.12, shovel 0.9 0.12, pickaxe 0.5 0.35, saw 0.12 0.35, tongs 0.3 0.06, chisel 0.12 0.02,
    woodPlane 0.06 0.15, oar 1.3 0.1, fishingRod 1.4 0.03, broom 0.8 0.15, key 0.05 0.02, coins 0.04 0.06, scroll 0.15 0.05, document 0.17 0.12,
    letter 0.1 0.12, book 0.15 0.1, newspaper 0.2 0.15, mapScroll 0.25 0.06, brushInk 0.12 0.02, quillPen 0.15 0.02, inkStone 0.04 0.1,
    phone 0.08 0.04, smartphone 0.09 0.05, tablet 0.14 0.1, camera 0.08 0.1, bulb 0.08 0.05, cup 0.07 0.05, wineCup 0.08 0.05, plate 0.02 0.15,
    pan 0.05 0.3, kettle 0.15 0.15, teapot 0.12 0.15, chopsticks 0.15 0.01, bowl 0.06 0.1, riceBowl 0.06 0.08, bread 0.07 0.15, meat 0.06 0.15,
    fish 0.06 0.2, cheese 0.06 0.1, eggs 0.04 0.1, roastChicken 0.1 0.2, wineBottle 0.18 0.05, gourd 0.18 0.1, purse 0.08 0.08, abacus 0.08 0.2,
    ledger 0.15 0.12, paperMoney 0.05 0.1, rosary 0.15 0.05, mask 0.14 0.1, mirror 0.14 0.1, doll 0.15 0.08, crown 0.1 0.12, skull 0.1 0.12,
    hourglass 0.12 0.06, medal 0.05 0.03, sewingNeedle 0.03 0.01, syringe 0.07 0.01, bandageRoll 0.05 0.05, medicineBag 0.15 0.2, herbBasket 0.12 0.2,
    talisman 0.1 0.05, jossPaper 0.1 0.08, firecrackers 0.2 0.05, paperLantern 0.25 0.18, kite 0.6 0.5 air, fireArrow 0.06 0.45 air, arrowVolley 0.6 3 air, arrow 0.06 0.45 air, bolt 0.06 0.25 air, thrownSpear 0.06 1.3 air,
    cannonShot 0.08 0.25 air, slingStone 0.06 0.2 air,
    lock 0.05 0.04, threshingFlail 0.9 0.1, chain 0.05 0.6, rope 0.05 0.8, net 0.05 1, bundle 0.25 0.35, backpack 0.3 0.2, carryingPole 0.5 1.1,
    tray 0.05 0.3, teaSet 0.08 0.3, samovar 0.3 0.2, clock 0.15 0.15, calendar 0.2 0.15, wallPhone 0.15 0.08, candlestickPhone 0.18 0.06, radio 0.15 0.25,
    lute 0.4 0.15, corinthianHelmet 0.15 0.12, galeaHelmet 0.15 0.12, nasalHelmet 0.15 0.12, greatHelm 0.18 0.13, morionHelmet 0.15 0.18,
    pickelhaube 0.15 0.12, brodieHelmet 0.1 0.18, helmetProp 0.15 0.13, shieldProp 0.5 0.45, lionDanceHead 0.4 0.4, offeringTray 0.06 0.3
  `),
  // On the ground: furniture, gear, structures, things of the land.
  ...table("ground", `
    spearStand 1 0.6, weaponRack 0.9 0.8, cannonballs 0.15 0.3, batteringRam 0.9 3, warDrum 0.5 0.5, stake 1 0.05, skullPile 0.3 0.5, gallows 1.8 1.4,
    guillotine 2.4 0.8, stocks 0.6 0.9, barrel 0.45 0.35, crate 0.4 0.45, sack 0.35 0.3, chest 0.4 0.55, basket 0.3 0.3, bucket 0.2 0.18, jar 0.4 0.3,
    amphora 0.45 0.25, cookpot 0.35 0.4, cauldron 0.5 0.6, table 0.45 0.9, chair 0.55 0.3, stool 0.28 0.25, bench 0.3 0.9, bed 0.4 1.2, cradle 0.4 0.6,
    hospitalBed 0.5 1.2, sofa 0.5 1.2, throne 0.9 0.5, desk 0.45 0.8, cupboard 1 0.6, shelf 1.1 0.6, bookshelf 1.1 0.6, wardrobe 1.1 0.6,
    foldingScreen 1 1.2, fireplace 0.8 0.9, hearth 0.3 0.8, stove 0.5 0.5, bathtub 0.35 0.9, door 1.2 0.55, window 0.7 0.6, ladder 2 0.3,
    woodpile 0.5 1, haystack 0.9 1.2, well 0.9 0.8, campfire 0.35 0.4, bonfirePit 0.4 0.6, signalFire 0.6 0.6, lamppost 2.2 0.3, electricLamp 0.3 0.15,
    electricFan 0.3 0.2, television 0.3 0.35, fridge 1 0.4, sewingMachine 0.2 0.3, typewriter 0.12 0.25, gramophone 0.35 0.25, computer 0.25 0.3,
    anvil 0.45 0.4, loom 1 1, spinningWheel 0.6 0.6, potteryWheel 0.4 0.4, mortar 0.3 0.2, plow 0.5 1.2, harrow 0.3 1, yoke 0.2 0.8,
    wheelbarrow 0.4 0.8, handcart 0.6 1.2, cart 0.7 1.6, sled 0.3 1.2, saddle 0.25 0.35, anchor 0.6 0.4, sail 2 1.2, pier 0.3 4, fishTrap 0.3 0.5,
    scarecrow 1.2 0.7, beehive 0.4 0.3, hammock 0.6 1.6, umbrella 1.1 1, blackboard 0.6 0.8, mapTable 0.5 1, signpost 1.3 0.5, stonePile 0.3 0.6,
    altar 0.6 0.8, ancestorAltar 0.9 0.8, shrine 1 0.6, spiritHouse 1.2 0.5, statue 1.4 0.5, buddhaStatue 1.6 1.2, column 3 0.4, obelisk 6 0.8,
    arch 3 2.4, bell 0.5 0.45, gong 0.9 0.7, incenseBurner 0.4 0.3, prayerWheel 0.6 0.3, cross 1.4 0.6, gravestone 0.5 0.4, grave 0.2 1.2,
    tomb 1 1.4, tombMound 0.6 1.6, coffin 0.4 1.2, bodyCovered 0.2 1.1, stretcher 0.3 1.2, scale 0.3 0.3, trophy 0.25 0.15, globe 0.35 0.25,
    printingPress 1.2 1, forge 0.9 1, bellows 0.3 0.6, kiln 1.4 1.2, carpenterBench 0.5 1.2, dyeVat 0.6 0.8, tanningRack 1.2 1, steamEngine 1.6 2.4,
    shipHull 1.6 6, waterWheel 2.4 2.4, shadoof 2.6 2, millstone 0.4 0.7, granaryJar 1 0.8, chickenCoop 0.6 0.8, pigsty 0.7 1.6, animalPen 0.6 2.4,
    ricePlants 0.3 0.6, wheatSheaf 0.6 0.4, cornStalks 1.2 0.6, counter 0.6 1.2, shopSign 0.4 0.6, goodsBales 0.5 0.8, spiceSacks 0.4 0.8,
    clothRolls 0.4 0.8, potteryStack 0.5 0.6, cashRegister 0.2 0.25, vegetables 0.15 0.4, fruitBasket 0.2 0.3, winnowingBasket 0.05 0.4,
    palanquin 1 1.6, mat 0.02 1, prayerRug 0.02 0.8, telegraph 0.2 0.3, satelliteDish 1.2 1, loudspeaker 0.4 0.3, poster 0.5 0.4, maypole 3.6 0.6,
    menorah 0.4 0.3, flagPole 4.2 0.6, hitchingPost 0.8 1.2, supplyCrates 0.8 1.4, ammoBox 0.3 0.45, fieldTelephone 0.2 0.25, radioSet 0.35 0.4,
    minefieldSign 0.9 0.4, tankTrap 0.8 1, caltrops 0.05 0.6, punjiSticks 0.4 1, foxhole 0.3 1.2, tunnelEntrance 0.4 1, crater 0.3 2,
    brokenWheel 0.6 0.6, fallenBanner 0.1 1.6, scatteredWeapons 0.1 1.2, judgeTable 0.6 1.2, cangue 0.6 0.6, prisonCart 1.2 2, cage 1 1,
    shackles 0.05 0.3, mortarTube 0.5 0.3, planks 0.15 1.2, log 0.25 1.4, stump 0.3 0.45, rock 0.3 0.45, boulder 0.6 0.9, grass 0.2 0.3,
    reeds 0.6 0.4, flowers 0.2 0.3, lotus 0.2 0.3, bushes 0.6 1.4, mushroom 0.05 0.05, fallenLeaves 0.02 0.6, snowdrift 0.3 1.4, puddle 0.01 0.8,
    termiteMound 1 0.6, bookStack 0.25 0.15, wheel 0.6 0.1, chainmail 0.6 0.5, plateArmor 1.2 0.5, lamellar 0.7 0.5,
    samuraiArmor 1 0.5
  `),
  ...table("ground", `moat 0.2 6, wheatField 0.5 8, cornField 1.2 8, irrigationCanal 0.1 6, fishPond 0.1 4`),
];

// Every library kind's size; a kind not here is a gap the size check (verify-motion-scale-standard.ts) reports.
export const MOTION_OBJECT_SIZE: Record<string, MotionObjectSize> = Object.fromEntries([...VEHICLES, ...BUILDINGS, ...ANIMALS, ...TREES, ...WALLS, ...PROPS]);

// Poses a kind may be drawn in beyond its plain one (an aircraft flies or stands parked; a rocket flies or stands on its pad).
const AIRCRAFT = ["biplane", "plane", "fighter", "bomber", "jet", "airliner", "transportPlane", "helicopter", "attackHelicopter"];
AIRCRAFT.forEach((id) => (MOTION_OBJECT_SIZE[id].poses = ["fly", "parked"]));
MOTION_OBJECT_SIZE.rocket.poses = ["fly", "launch"];
["balloon", "airship", "missile", "drone"].forEach((id) => (MOTION_OBJECT_SIZE[id].poses = ["fly"]));

// The place of a thing in a scene: what it is by nature, or on the ground for an aircraft drawn parked.
export const motionObjectPlace = (kind: string | undefined, pose?: string): MotionObjectPlace | undefined => {
  const size = kind ? MOTION_OBJECT_SIZE[kind] : undefined;
  if (!size) return undefined;
  return size.place === "air" && (pose === "parked" || pose === "launch") ? "ground" : size.place;
};
// How far an air thing is (its size against the reference person): near, mid or far.
export const MOTION_AIR_DISTANCE = { near: 0.6, mid: 0.2, far: 0.07 } as const;
