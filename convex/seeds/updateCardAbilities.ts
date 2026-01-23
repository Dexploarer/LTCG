import { mutation } from "../_generated/server";

/**
 * Update all 180 starter deck cards with abilities, flavor texts, and placeholder images
 * Data extracted from /Users/home/lunchtable/convex/cards/archetypeData.ts
 */

const CARD_UPDATES = [
  // INFERNAL DRAGONS (Fire) - 45 cards
  { name: "Ember Wyrmling", ability: "", flavorText: "A young dragon whose flames burn with limitless potential." },
  { name: "Infernal Hatchling", ability: "", flavorText: "Born from volcanic ash, it seeks its first flame." },
  { name: "Scorched Serpent", ability: "", flavorText: "Its scales glow red from the eternal fire within." },
  { name: "Flame Whelp", ability: "", flavorText: "The smallest spark can ignite the greatest inferno." },
  { name: "Blazing Drake", ability: "", flavorText: "Its wings leave trails of fire across the sky." },
  { name: "Cinder Wyrm", ability: "This card gains 200 ATK during your Battle Phase.", flavorText: "The heat it radiates can melt steel." },
  { name: "Magma Hatchling", ability: "When this card is destroyed: Inflict 300 damage to your opponent.", flavorText: "Even in death, its flames persist." },
  { name: "Infernal Scout", ability: "This card can attack directly if your opponent controls no monsters in Attack Position.", flavorText: "It finds prey even in the darkest depths." },
  { name: "Pyroclast Wyvern", ability: "Once per turn: Inflict 200 damage to your opponent.", flavorText: "Its breath carries the fury of erupting volcanoes." },
  { name: "Smoldering Newt", ability: "When this card inflicts battle damage: Draw 1 card, then discard 1 card.", flavorText: "Small but dangerously hot." },
  { name: "Ashen Dragonet", ability: "", flavorText: "Covered in the ash of fallen foes." },
  { name: "Kindled Basilisk", ability: "", flavorText: "Its gaze burns as hotly as its flames." },
  { name: "Infernal Vanguard", ability: "This card inflicts piercing battle damage.", flavorText: "The first to charge, the last to fall." },
  { name: "Blazetail Guardian", ability: "When this card is attacked: Inflict 400 damage to your opponent after damage calculation.", flavorText: "Its tail whip leaves burning scars." },
  { name: "Crimson Firebreather", ability: "Once per turn: Destroy 1 Spell/Trap your opponent controls.", flavorText: "Nothing survives its crimson breath." },
  { name: "Volcanic Striker", ability: "When this card destroys a monster by battle: Inflict 500 damage to your opponent.", flavorText: "Each strike brings volcanic devastation." },
  { name: "Flame Herald", ability: "When Summoned: Add 1 'Infernal' Spell from your deck to your hand.", flavorText: "It announces the arrival of the inferno." },
  { name: "Magma Carrier", ability: "All 'Infernal Dragons' monsters you control gain 300 ATK.", flavorText: "It carries the heart of the volcano within." },
  { name: "Pyre Sentinel", ability: "Once per turn, when an 'Infernal Dragons' monster you control would be destroyed: You can destroy this card instead.", flavorText: "It guards the flame with its life." },
  { name: "Infernal Charger", ability: "This card can attack twice per Battle Phase, but is destroyed at the end of the Battle Phase.", flavorText: "It lives only for the thrill of battle." },
  { name: "Infernal Warlord", ability: "All 'Infernal Dragons' monsters you control gain 400 ATK. This card inflicts piercing battle damage.", flavorText: "Under its command, all dragons burn brighter." },
  { name: "Volcanic Dragon", ability: "When Summoned: Destroy all Spell/Trap cards your opponent controls.", flavorText: "Born from the deepest magma chambers." },
  { name: "Infernal Ravager", ability: "When this card destroys a monster by battle: Destroy 1 card your opponent controls.", flavorText: "It leaves nothing but ashes in its wake." },
  { name: "Pyromancer Drake", ability: "Once per turn: You can discard 1 'Infernal' Spell; inflict 1000 damage to your opponent.", flavorText: "It channels magic into pure destructive fire." },
  { name: "Hellfire Wyrm", ability: "During each End Phase: Inflict 300 damage to your opponent for each 'Infernal Dragons' monster you control.", flavorText: "The fires of the underworld obey its call." },
  { name: "Infernal Tyrant", ability: "Cannot be destroyed by battle. Once per turn: Destroy 1 monster your opponent controls with ATK less than this card's ATK.", flavorText: "All lesser dragons kneel before its might." },
  { name: "Volcanic Behemoth", ability: "This card inflicts piercing battle damage. When this card destroys a monster by battle: Inflict damage equal to that monster's original ATK.", flavorText: "A walking catastrophe that reshapes the land." },
  { name: "Infernal Phoenix", ability: "Once per turn, if this card would be destroyed: It is not destroyed. When this card is Summoned: Inflict 800 damage to your opponent.", flavorText: "Death cannot contain its eternal flame." },
  { name: "Infernal Overlord Vyraxis", ability: "Once per turn: Destroy all monsters with ATK lower than this card's ATK. All 'Infernal Dragons' monsters you control gain 500 ATK. If this card is destroyed: Special Summon 1 'Infernal Dragons' monster from your GY.", flavorText: "The supreme ruler of all dragonkind." },
  { name: "Apocalypse Dragon", ability: "When Summoned: Destroy all other cards on the field. This card inflicts piercing battle damage. When this card inflicts battle damage: Inflict 1000 additional damage. Cannot be targeted by opponent's card effects.", flavorText: "Its awakening heralds the end of all things." },
  { name: "Dragon's Fury", ability: "Target 1 'Infernal Dragons' monster you control; it gains 500 ATK until end of turn.", flavorText: "Channel the rage of a thousand dragons." },
  { name: "Volcanic Eruption", ability: "Inflict 500 damage to your opponent.", flavorText: "The mountain's wrath unleashed." },
  { name: "Infernal Recovery", ability: "Add 1 'Infernal Dragons' monster with 1500 or less ATK from your GY to your hand.", flavorText: "Even in death, the flame persists." },
  { name: "Fire Breathing", ability: "Target 1 'Infernal Dragons' monster you control; it can attack directly this turn, but its ATK is halved.", flavorText: "Strike past their defenses." },
  { name: "Sudden Ignition", ability: "Target 1 'Infernal Dragons' monster you control; it gains 800 ATK until end of turn. (Quick Spell)", flavorText: "The flame burns brightest in battle." },
  { name: "Infernal Barrier", ability: "Negate 1 attack targeting an 'Infernal Dragons' monster you control. (Quick Spell)", flavorText: "A wall of flames protects the dragons." },
  { name: "Scorching Wind", ability: "Target 1 monster your opponent controls; it loses 600 ATK until end of turn. (Quick Spell)", flavorText: "The wind carries burning embers." },
  { name: "Infernal Furnace", ability: "Once per turn: Inflict 200 damage to your opponent for each 'Infernal Dragons' monster you control. (Continuous Spell)", flavorText: "The furnace of destruction never cools." },
  { name: "Dragon's Hoard", ability: "Once per turn, when an 'Infernal Dragons' monster inflicts battle damage: Draw 1 card. (Continuous Spell)", flavorText: "Victory brings wealth beyond measure." },
  { name: "Volcanic Lair", ability: "All 'Infernal Dragons' monsters gain 300 ATK. Once per turn: You can Normal Summon 1 additional 'Infernal Dragons' monster. (Field Spell)", flavorText: "Within the volcano, dragons reign supreme." },
  { name: "Flame Trap", ability: "When your opponent's monster declares an attack: Inflict 500 damage to your opponent.", flavorText: "Step into the fire." },
  { name: "Burning Revenge", ability: "When an 'Infernal Dragons' monster you control is destroyed: Inflict 800 damage to your opponent.", flavorText: "Even in death, they strike back." },
  { name: "Ring of Fire", ability: "Your opponent takes 200 damage each time they Normal Summon a monster. (Continuous Trap)", flavorText: "The flames encircle all who enter." },
  { name: "Infernal Presence", ability: "'Infernal Dragons' monsters you control cannot be targeted by Spell effects. (Continuous Trap)", flavorText: "The flames shield their own." },
  { name: "Dragon's Wrath", ability: "When your opponent activates a card effect: Negate that effect, and if you control an 'Infernal Dragons' monster, destroy that card. (Counter Trap)", flavorText: "Defy the dragons at your peril." },

  // ABYSSAL DEPTHS (Water) - 45 cards
  { name: "Reef Crab", ability: "", flavorText: "A resilient crustacean from the ocean floor." },
  { name: "Coral Serpent", ability: "", flavorText: "It weaves between coral reefs with deadly precision." },
  { name: "Tidal Eel", ability: "", flavorText: "Swift currents guide its path." },
  { name: "Murky Triton", ability: "", flavorText: "Guardian of the shallow waters." },
  { name: "Deep Mermaid", ability: "", flavorText: "Her song lures sailors to the depths." },
  { name: "Glacial Crab", ability: "At the start of the Battle Phase: Increase this card's DEF by 200.", flavorText: "Its icy shell is nearly impenetrable." },
  { name: "Undertow Shark", ability: "When this card inflicts battle damage: Return 1 monster your opponent controls to their hand.", flavorText: "The undertow claims all who swim above." },
  { name: "Frozen Hydra", ability: "Once per turn: You can target 1 monster your opponent controls; its ATK becomes 0 until end of turn.", flavorText: "Its breath freezes all in its path." },
  { name: "Sunken Squid", ability: "When Summoned: Draw 1 card, then discard 1 card.", flavorText: "Lost in the depths, it searches for light." },
  { name: "Riptide Whale", ability: "", flavorText: "Its songs echo through the ocean trenches." },
  { name: "Abyssal Siren", ability: "When this card inflicts battle damage: Your opponent discards 1 card.", flavorText: "Her voice drowns reason." },
  { name: "Oceanic Jellyfish", ability: "", flavorText: "Drifting through the currents, patiently waiting." },
  { name: "Tidal Serpent", ability: "This card can attack directly. If it does, halve the battle damage.", flavorText: "It strikes from the waves unseen." },
  { name: "Glacial Hydra", ability: "Cannot be destroyed by battle with monsters that have higher ATK.", flavorText: "The ice protects it from all harm." },
  { name: "Reef Guardian", ability: "Once per turn, when a Water monster you control would be destroyed: You can destroy this card instead.", flavorText: "It stands watch over the coral kingdoms." },
  { name: "Deep Hunter", ability: "When this card destroys a monster by battle: You can add 1 Water monster from your deck to your hand.", flavorText: "It hunts in the darkest trenches." },
  { name: "Frozen Leviathan", ability: "All monsters your opponent controls lose 300 ATK.", flavorText: "The cold slows all who approach." },
  { name: "Murky Stalker", ability: "This card cannot be destroyed by Spell/Trap effects.", flavorText: "Hidden in murky waters, it waits." },
  { name: "Coral Enchantress", ability: "When Summoned: Return 1 Spell/Trap your opponent controls to their hand.", flavorText: "Her magic flows with the tides." },
  { name: "Undertow Kraken", ability: "When Summoned: Return up to 2 monsters your opponent controls to their hand.", flavorText: "The undertow drags all beneath." },
  { name: "Abyssal Lord", ability: "All Water monsters you control gain 400 ATK. This card inflicts piercing battle damage.", flavorText: "Ruler of the abyss and all beneath." },
  { name: "Tidal Dragon", ability: "When Summoned: Return all Spell/Trap cards on the field to their owners' hands.", flavorText: "The tides obey its command." },
  { name: "Glacial Monarch", ability: "Cannot be destroyed by battle or card effects. Your opponent cannot activate cards during the Battle Phase.", flavorText: "Frozen in eternal majesty." },
  { name: "Deep Sea Terror", ability: "When this card destroys a monster by battle: Draw 2 cards.", flavorText: "From the depths, terror emerges." },
  { name: "Frozen Sovereign", ability: "During each End Phase: Return 1 monster your opponent controls to their hand.", flavorText: "The ice king who never melts." },
  { name: "Leviathan Prime", ability: "Cannot be destroyed by battle. All Water monsters you control gain 500 ATK. When this card inflicts battle damage: Your opponent returns 1 card from their hand to their deck.", flavorText: "The ancient beast of legend." },
  { name: "Abyssal Tyrant", ability: "Cannot be targeted by opponent's card effects. All other monsters on the field lose 400 ATK/DEF.", flavorText: "The tyrant of the deepest waters." },
  { name: "Kraken Overlord", ability: "When Summoned: Return all other cards on the field to their owners' hands. This card can attack all monsters your opponent controls once each.", flavorText: "Its tentacles reach across the ocean." },
  { name: "Tidal Emperor Nereus", ability: "Monsters your opponent controls cannot activate effects. When Summoned: Return all cards your opponent controls to their hand. Cannot be targeted or destroyed by opponent's card effects.", flavorText: "Emperor of the seven seas." },
  { name: "Leviathan of the Abyss", ability: "Monsters your opponent controls cannot attack or activate effects. When Summoned: Return all other cards on the field to their owners' hands. Cannot be targeted by opponent's card effects.", flavorText: "From the deepest trenches, it rises to consume all." },
  { name: "Tidal Wave", ability: "Return 1 monster your opponent controls to their hand.", flavorText: "The ocean crashes down." },
  { name: "Glacial Blessing", ability: "Target 1 Water monster you control; it gains 600 ATK until end of turn.", flavorText: "The blessing of the frozen seas." },
  { name: "Deep Recovery", ability: "Add 1 Water monster from your GY to your hand.", flavorText: "The depths reclaim their own." },
  { name: "Frozen Touch", ability: "Target 1 monster your opponent controls; it cannot attack or activate effects this turn.", flavorText: "Frozen solid by a single touch." },
  { name: "Sudden Freeze", ability: "Target 1 monster; it cannot attack or change position until the end of next turn. (Quick Spell)", flavorText: "The cold strikes without warning." },
  { name: "Abyssal Shield", ability: "Negate 1 attack targeting a Water monster you control. (Quick Spell)", flavorText: "The abyss protects its own." },
  { name: "Riptide Counter", ability: "When a Water monster you control is targeted: Return that targeting card to its owner's hand. (Quick Spell)", flavorText: "The current reverses all." },
  { name: "Endless Depths", ability: "Once per turn: You can return 1 card your opponent controls to their hand. (Continuous Spell)", flavorText: "The depths have no end." },
  { name: "Frozen Prison", ability: "Target 1 monster your opponent controls; it cannot attack, change position, or activate effects. (Continuous Spell)", flavorText: "Trapped in eternal ice." },
  { name: "Abyssal Trench", ability: "All Water monsters gain 300 ATK. Once per turn: You can add 1 Water monster from your deck to your hand. (Field Spell)", flavorText: "In the trench, water creatures thrive." },
  { name: "Frozen Ambush", ability: "When your opponent's monster declares an attack: That monster cannot attack this turn.", flavorText: "The ice strikes first." },
  { name: "Tidal Revenge", ability: "When a Water monster you control is destroyed: Return 1 monster your opponent controls to their hand.", flavorText: "The tide takes revenge." },
  { name: "Icy Presence", ability: "Water monsters you control cannot be destroyed by battle. (Continuous Trap)", flavorText: "The ice shields all." },
  { name: "Abyssal Barrier", ability: "Your opponent cannot target Water monsters you control with card effects. (Continuous Trap)", flavorText: "The abyss hides its servants." },
  { name: "Depth Rejection", ability: "When your opponent activates a card effect: Negate that effect, and if you control a Water monster, return that card to their hand. (Counter Trap)", flavorText: "The depths reject all intruders." },

  // IRON LEGION (Earth) - 45 cards
  { name: "Iron Soldier", ability: "", flavorText: "A foot soldier of the unbreakable legion." },
  { name: "Bronze Centurion", ability: "", flavorText: "Clad in bronze, he marches forward." },
  { name: "Steel Knight", ability: "", flavorText: "Steel armor, iron will." },
  { name: "Armored Recruit", ability: "", flavorText: "Training to join the legion's ranks." },
  { name: "Battle Sentinel", ability: "", flavorText: "Watchful guardian of the fortress." },
  { name: "Plated Defender", ability: "At the start of the Damage Step: This card's DEF is doubled until the end of the Damage Step.", flavorText: "Its armor deflects all attacks." },
  { name: "Siege Tank", ability: "This card inflicts piercing battle damage.", flavorText: "An unstoppable force on the battlefield." },
  { name: "Fortified Warden", ability: "Once per turn, when an Earth monster you control would be destroyed by battle: You can destroy this card instead.", flavorText: "The warden protects the weak." },
  { name: "Heavy Golem", ability: "Cannot be destroyed by monsters with less ATK.", flavorText: "A construct of pure strength." },
  { name: "Iron Phalanx", ability: "", flavorText: "Marching in perfect formation." },
  { name: "Shield Bearer", ability: "All Earth monsters you control gain 200 DEF.", flavorText: "The shield protects the legion." },
  { name: "Battle Automaton", ability: "", flavorText: "A mechanical warrior built for war." },
  { name: "Fortress Guardian", ability: "Cannot be destroyed by battle with monsters that have higher ATK.", flavorText: "The fortress stands eternal." },
  { name: "Iron Juggernaut", ability: "When this card destroys a monster by battle: Inflict 500 damage to your opponent.", flavorText: "Nothing stops its advance." },
  { name: "Steel Colossus", ability: "All Earth monsters you control gain 300 DEF.", flavorText: "A titan of steel and stone." },
  { name: "Bronze Titan", ability: "This card can attack twice per Battle Phase.", flavorText: "Bronze fists strike with fury." },
  { name: "Armored Champion", ability: "Cannot be destroyed by Spell/Trap effects.", flavorText: "The champion of the legion." },
  { name: "Siege General", ability: "All Earth monsters you control gain 300 ATK.", flavorText: "The general commands the siege." },
  { name: "Iron Vanguard", ability: "Once per turn: You can change this card to Attack Position, and if you do, it gains 400 DEF.", flavorText: "First in battle, last to fall." },
  { name: "Battle Machina", ability: "When Summoned: You can add 1 Earth monster from your deck to your hand.", flavorText: "A machine built for conquest." },
  { name: "Iron Overlord", ability: "All Earth monsters you control gain 400 ATK. This card's DEF becomes equal to its ATK.", flavorText: "The overlord commands absolute power." },
  { name: "Fortress Titan", ability: "Cannot be destroyed by battle or card effects once per turn.", flavorText: "The titan that never falls." },
  { name: "Steel Behemoth", ability: "This card inflicts piercing battle damage. When this card destroys a monster by battle: Inflict 500 damage to your opponent.", flavorText: "A behemoth of pure destruction." },
  { name: "Siege Destroyer", ability: "When this card destroys a monster by battle: Destroy 1 Spell/Trap your opponent controls.", flavorText: "The destroyer levels all defenses." },
  { name: "Iron Emperor", ability: "All Earth monsters you control gain 500 DEF. Cannot be targeted by opponent's card effects.", flavorText: "Emperor of the iron throne." },
  { name: "Colossus Prime", ability: "Cannot be destroyed by battle. All Earth monsters you control gain 500 ATK/DEF. When this card inflicts battle damage: Draw 1 card.", flavorText: "The prime construct of legend." },
  { name: "Fortress Supreme", ability: "Cannot be destroyed by battle or card effects. Your opponent cannot target other Earth monsters you control with card effects.", flavorText: "The supreme fortress, unbreakable." },
  { name: "Iron Goliath", ability: "This card inflicts piercing battle damage. When this card destroys a monster by battle: Inflict damage equal to its original DEF.", flavorText: "The goliath that crushes all." },
  { name: "Legion Commander Magnus", ability: "Cannot be destroyed by battle. All Earth monsters you control gain 600 ATK/DEF. Once per turn: Negate 1 card effect that targets an Earth monster you control.", flavorText: "The legendary commander of the legion." },
  { name: "Titan of the Citadel", ability: "Cannot be destroyed by battle or card effects. All Earth monsters you control gain 700 ATK/DEF. This card's ATK becomes equal to its DEF during the Battle Phase.", flavorText: "The eternal guardian of the citadel." },
  { name: "Iron Fortify", ability: "Target 1 Earth monster you control; it gains 500 DEF until end of turn.", flavorText: "Steel reinforced beyond measure." },
  { name: "Legion Rally", ability: "All Earth monsters you control gain 400 ATK until end of turn.", flavorText: "The legion marches as one." },
  { name: "Steel Recovery", ability: "Add 1 Earth monster from your GY to your hand.", flavorText: "The fallen rise again." },
  { name: "Armored March", ability: "Target 1 Earth monster you control; it can attack directly this turn, but its ATK is halved.", flavorText: "March through enemy lines." },
  { name: "Siege Formation", ability: "Target 1 Earth monster you control; it gains 600 ATK and can attack twice this turn. (Quick Spell)", flavorText: "Form the siege line." },
  { name: "Iron Wall", ability: "Negate 1 attack targeting an Earth monster you control. (Quick Spell)", flavorText: "An impenetrable barrier." },
  { name: "Battle Cry", ability: "All Earth monsters you control gain 300 ATK until end of turn. (Quick Spell)", flavorText: "The legion's battle cry echoes." },
  { name: "Fortress Arsenal", ability: "Once per turn: Draw 1 card when an Earth monster you control destroys a monster by battle. (Continuous Spell)", flavorText: "The fortress supplies endless weapons." },
  { name: "Legion's Might", ability: "All Earth monsters gain 400 ATK. Earth monsters cannot be destroyed by battle with monsters that have higher ATK. (Continuous Spell)", flavorText: "The legion's strength knows no bounds." },
  { name: "Iron Citadel", ability: "All Earth monsters gain 300 ATK/DEF. Once per turn: You can Normal Summon 1 additional Earth monster. (Field Spell)", flavorText: "Within the citadel, the legion is unstoppable." },
  { name: "Shield Counter", ability: "When your opponent's monster declares an attack on an Earth monster you control: Negate that attack.", flavorText: "The shield deflects all." },
  { name: "Iron Revenge", ability: "When an Earth monster you control is destroyed by battle: Inflict damage equal to its DEF to your opponent.", flavorText: "Even in defeat, the legion strikes back." },
  { name: "Defensive Formation", ability: "Earth monsters you control cannot be destroyed by battle. (Continuous Trap)", flavorText: "The legion holds the line." },
  { name: "Legion's Guard", ability: "Your opponent cannot target Earth monsters you control with card effects. (Continuous Trap)", flavorText: "The legion guards its own." },
  { name: "Fortress Lockdown", ability: "When your opponent activates a card effect: Negate that effect, and if you control an Earth monster, that card cannot be activated again this turn. (Counter Trap)", flavorText: "The fortress locks down all threats." },

  // STORM RIDERS (Wind) - 45 cards
  { name: "Wind Scout", ability: "", flavorText: "Swift as the wind, silent as the breeze." },
  { name: "Sky Hawk", ability: "", flavorText: "Soaring above the battlefield." },
  { name: "Gale Sprite", ability: "", flavorText: "A playful spirit of the sky." },
  { name: "Storm Falcon", ability: "", flavorText: "Its cry announces the coming storm." },
  { name: "Thunder Raven", ability: "", flavorText: "Lightning follows in its wake." },
  { name: "Zephyr Griffin", ability: "When this card inflicts battle damage: Draw 1 card.", flavorText: "The gentle breeze carries wisdom." },
  { name: "Cyclone Rider", ability: "This card can attack directly. If it does, halve the battle damage.", flavorText: "Riding the cyclone into battle." },
  { name: "Gust Harpy", ability: "When Summoned: Return 1 Spell/Trap your opponent controls to their hand.", flavorText: "Her winds scatter all defenses." },
  { name: "Tempest Eagle", ability: "This card inflicts piercing battle damage.", flavorText: "The tempest strikes with precision." },
  { name: "Breeze Pixie", ability: "When this card inflicts battle damage: Your opponent discards 1 card.", flavorText: "The breeze whispers secrets away." },
  { name: "Lightning Wisp", ability: "", flavorText: "A spark of lightning given form." },
  { name: "Cloud Serpent", ability: "", flavorText: "It weaves through the clouds unseen." },
  { name: "Storm Sentinel", ability: "Once per turn: You can target 1 monster your opponent controls; return it to their hand.", flavorText: "The sentinel guards the skies." },
  { name: "Gale Lord", ability: "When this card destroys a monster by battle: Draw 1 card.", flavorText: "Lord of the gale winds." },
  { name: "Thunder Wyvern", ability: "When this card inflicts battle damage: Inflict 400 damage to your opponent.", flavorText: "Thunder and fury combined." },
  { name: "Cyclone Master", ability: "This card can attack twice per Battle Phase.", flavorText: "Master of the cyclone." },
  { name: "Sky Commander", ability: "All Wind monsters you control gain 300 ATK.", flavorText: "Commander of the skies." },
  { name: "Tempest Rider", ability: "Cannot be destroyed by Spell/Trap effects.", flavorText: "Riding the tempest to victory." },
  { name: "Zephyr Champion", ability: "When Summoned: You can add 1 Wind monster from your deck to your hand.", flavorText: "Champion of the zephyr." },
  { name: "Lightning Striker", ability: "This card inflicts piercing battle damage. When this card destroys a monster by battle: Draw 1 card.", flavorText: "Lightning strikes with deadly precision." },
  { name: "Storm Emperor", ability: "All Wind monsters you control gain 400 ATK. This card can attack directly.", flavorText: "Emperor of the storm." },
  { name: "Thunder Dragon", ability: "When Summoned: Return up to 2 cards your opponent controls to their hand.", flavorText: "The dragon of thunder and lightning." },
  { name: "Tempest Overlord", ability: "This card can attack all monsters your opponent controls once each. When this card destroys a monster by battle: Draw 1 card.", flavorText: "Overlord of the tempest." },
  { name: "Gale Sovereign", ability: "All Wind monsters you control gain 500 ATK. Cannot be destroyed by battle.", flavorText: "Sovereign of the gale." },
  { name: "Cyclone Tyrant", ability: "This card can attack twice per Battle Phase. When this card destroys a monster by battle: Return 1 card your opponent controls to their hand.", flavorText: "Tyrant of the cyclone." },
  { name: "Thunder Colossus", ability: "Cannot be targeted by opponent's card effects. All Wind monsters you control gain 500 ATK. When this card inflicts battle damage: Inflict 1000 damage to your opponent.", flavorText: "The colossus of thunder." },
  { name: "Storm Titan", ability: "This card can attack directly. When this card inflicts battle damage: Draw 2 cards. Cannot be destroyed by card effects.", flavorText: "The titan of storms." },
  { name: "Tempest Behemoth", ability: "This card can attack all monsters your opponent controls once each. This card inflicts piercing battle damage.", flavorText: "The behemoth of the tempest." },
  { name: "Sky Lord Zephyros", ability: "Cannot be targeted or destroyed by opponent's card effects. All Wind monsters you control gain 600 ATK. This card can attack directly. When this card inflicts battle damage: Draw 2 cards.", flavorText: "Lord of all the skies." },
  { name: "Primordial Tempest", ability: "This card can attack up to 3 times per Battle Phase. This card inflicts piercing battle damage. This card can attack directly. Cannot be destroyed by card effects.", flavorText: "The storm incarnate, striking faster than lightning." },
  { name: "Lightning Strike", ability: "Inflict 600 damage to your opponent.", flavorText: "The lightning strikes true." },
  { name: "Gale Force", ability: "Return 1 monster your opponent controls to their hand.", flavorText: "The gale blows all away." },
  { name: "Storm Recovery", ability: "Add 1 Wind monster from your GY to your hand.", flavorText: "The storm reclaims its own." },
  { name: "Thunder Bolt", ability: "Target 1 monster your opponent controls; destroy it.", flavorText: "Thunder crashes down." },
  { name: "Sudden Gust", ability: "Target 1 monster; return it to its owner's hand. (Quick Spell)", flavorText: "The gust strikes without warning." },
  { name: "Cyclone Shield", ability: "Negate 1 attack targeting a Wind monster you control. (Quick Spell)", flavorText: "The cyclone shields all." },
  { name: "Tempest Call", ability: "All Wind monsters you control gain 500 ATK until end of turn. (Quick Spell)", flavorText: "Call forth the tempest." },
  { name: "Storm Arsenal", ability: "Once per turn: Draw 1 card when a Wind monster you control inflicts battle damage. (Continuous Spell)", flavorText: "The storm provides endless power." },
  { name: "Thunder Realm", ability: "All Wind monsters gain 400 ATK. Wind monsters can attack directly, but their ATK is halved during direct attacks. (Continuous Spell)", flavorText: "In the realm of thunder, wind reigns supreme." },
  { name: "Sky Fortress", ability: "All Wind monsters gain 300 ATK. Once per turn: You can add 1 Wind monster from your deck to your hand. (Field Spell)", flavorText: "Within the sky fortress, the storm is eternal." },
  { name: "Wind Barrier", ability: "When your opponent's monster declares an attack: Negate that attack.", flavorText: "The wind shields from all harm." },
  { name: "Lightning Counter", ability: "When a Wind monster you control is targeted: Inflict 500 damage to your opponent.", flavorText: "Lightning strikes back." },
  { name: "Storm Ambush", ability: "When your opponent's monster declares an attack: Return that monster to its owner's hand. (Continuous Trap)", flavorText: "The storm strikes from nowhere." },
  { name: "Gale Reflection", ability: "Wind monsters you control cannot be destroyed by battle. (Continuous Trap)", flavorText: "The gale deflects all attacks." },
  { name: "Tempest Wrath", ability: "When your opponent activates a card effect: Negate that effect, and if you control a Wind monster, return that card to their hand. (Counter Trap)", flavorText: "The tempest's wrath is absolute." },
];

export const updateAllCardAbilities = mutation({
  args: {},
  handler: async (ctx) => {
    const placeholderImage = "/assets/card-bg.svg";
    let updated = 0;
    let notFound = 0;

    for (const cardUpdate of CARD_UPDATES) {
      // Find card in cardDefinitions
      const cardDef = await ctx.db
        .query("cardDefinitions")
        .withIndex("by_name", (q) => q.eq("name", cardUpdate.name))
        .first();

      if (!cardDef) {
        notFound++;
        console.log(`Card not found: ${cardUpdate.name}`);
        continue;
      }

      // Update cardDefinitions
      await ctx.db.patch(cardDef._id, {
        ability: cardUpdate.ability,
        flavorText: cardUpdate.flavorText,
        imageUrl: placeholderImage,
      });

      // Find and update in cards table
      const card = await ctx.db
        .query("cards")
        .withIndex("by_name", (q) => q.eq("name", cardUpdate.name))
        .first();

      if (card) {
        await ctx.db.patch(card._id, {
          ability: cardUpdate.ability,
          flavorText: cardUpdate.flavorText,
          imageUrl: placeholderImage,
        });
      }

      updated++;
    }

    return {
      success: true,
      updated,
      notFound,
      total: CARD_UPDATES.length,
      message: `Updated ${updated} cards with abilities, flavor texts, and placeholder images`,
    };
  },
});
