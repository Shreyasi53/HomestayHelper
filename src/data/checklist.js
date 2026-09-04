// First-Time Host Checklist & Local Hill Hospitality Guide
export const DEFAULT_CATEGORIES = [
  {
    id: "cat_room",
    title: "Room Preparation",
    custom: false,
    tasks: [
      { id: "room_1", text: "Clean fresh bedsheets, pillow covers, and washed blankets ready.", completed: true },
      { id: "room_2", text: "Place 2 clean bath towels and a bar of soap on the side table.", completed: false },
      { id: "room_3", text: "Fill the bedside pitcher with fresh boiled/filtered spring water.", completed: true },
      { id: "room_4", text: "Charge emergency solar lantern and place it on the nightstand.", completed: false },
      { id: "room_5", text: "Check room window latches and curtain cords.", completed: false }
    ]
  },
  {
    id: "cat_hyg",
    title: "Hygiene & Water Management",
    custom: false,
    tasks: [
      { id: "hyg_1", text: "Sanitize toilet seat and check bathroom water bucket + mug.", completed: false },
      { id: "hyg_2", text: "Heat hot water for morning bath by 6:30 AM.", completed: true },
      { id: "hyg_3", text: "Empty wastebasket and put fresh liner bag.", completed: false },
      { id: "hyg_4", text: "Stock extra toilet paper / water spray nozzle.", completed: false }
    ]
  },
  {
    id: "cat_meal",
    title: "Meal Prep & Hospitality",
    custom: false,
    tasks: [
      { id: "meal_chk_1", text: "Ask guest about dietary restrictions (Pure Veg / Jain / Egg / Non-Veg).", completed: false },
      { id: "meal_chk_2", text: "Keep fresh Darjeeling First Flush tea leaves and cow milk ready.", completed: false },
      { id: "meal_chk_3", text: "Prepare evening snack (Hot Momos, Gundruk soup, or Pakoras).", completed: false },
      { id: "meal_chk_4", text: "Confirm dinner serving time with guest upon check-in.", completed: false }
    ]
  }
];

export const HOST_CHECKLIST = DEFAULT_CATEGORIES;

export const LOCAL_HILL_FACTS = [
  {
    title: "Darjeeling Himalayan Railway (DHR)",
    fact: "Opened in 1881, the DHR toy train runs on a 2-foot narrow gauge track over 88 km from Siliguri to Darjeeling. It was declared a UNESCO World Heritage site in 1999."
  },
  {
    title: "Batasia Loop",
    fact: "A famous spiral railway loop constructed in 1919 to lower the steep gradient of the train ascent. It offers a 360-degree view of Kanchenjunga."
  },
  {
    title: "Darjeeling Tea Heritage",
    fact: "Darjeeling tea is often called the 'Champagne of Teas'. The region has 87 tea gardens across ~17,500 hectares. First Flush is harvested in March-April."
  },
  {
    title: "Mount Kanchenjunga",
    fact: "At 8,586 meters, Kanchenjunga is the 3rd highest mountain in the world. Locals revere it as the sacred guardian deity of Sikkim and Darjeeling."
  }
];
