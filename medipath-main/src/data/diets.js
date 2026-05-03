// Diet plans mapped by medical specialty
export const DIET_PLANS = {
  "Cardiology": {
    foods: ["Leafy greens (spinach, kale, methi)", "Omega-3 rich fish (salmon, hilsa, sardines)", "Berries (blueberries, strawberries, amla)", "Whole grains (oats, brown rice, whole wheat roti)", "Nuts & seeds (walnuts, flaxseeds, almonds)", "Olive oil & mustard oil", "Legumes (moong dal, chana)"],
    avoid: ["Saturated fats & ghee excess", "Excess sodium / namkeen", "Processed meats", "Sugary drinks & mithai", "Trans fats (vanaspati)"],
    tip: "Follow a Mediterranean-style diet. Keep sodium under 2g/day. Include garlic and turmeric."
  },
  "Neurology": {
    foods: ["Fatty fish (salmon, mackerel)", "Dark leafy greens", "Walnuts & almonds", "Blueberries & dark chocolate", "Turmeric with black pepper", "Eggs", "Green tea"],
    avoid: ["Alcohol", "Excess caffeine", "Processed foods", "Artificial sweeteners", "High-sugar foods"],
    tip: "Brain-healthy diet rich in omega-3 and antioxidants. Stay well-hydrated."
  },
  "Orthopedics": {
    foods: ["Calcium-rich foods (milk, curd, paneer)", "Vitamin D sources (egg yolk, fatty fish)", "Leafy greens (broccoli, spinach)", "Lean proteins (chicken, fish, dal)", "Ragi & sesame seeds", "Bananas & oranges"],
    avoid: ["Excess caffeine (leaches calcium)", "Carbonated drinks", "Excess salt", "Alcohol", "Red meat in excess"],
    tip: "Focus on calcium (1000mg/day) and Vitamin D. Weight-bearing nutrition for bone health."
  },
  "Pulmonology": {
    foods: ["Anti-inflammatory foods (turmeric, ginger)", "Tomatoes & bell peppers", "Leafy greens", "Garlic & onions", "Apples & citrus fruits", "Green tea", "Lean proteins"],
    avoid: ["Dairy if it increases mucus", "Processed foods", "Excess salt", "Fried foods", "Cold drinks"],
    tip: "Eat small, frequent meals. Stay hydrated. Warm fluids help clear airways."
  },
  "Gastroenterology": {
    foods: ["Bananas & plain rice (BRAT diet)", "Boiled chicken & fish", "Yogurt with probiotics (curd/lassi)", "Ginger & mint tea", "Papaya & coconut water", "Khichdi & moong dal"],
    avoid: ["Spicy food & chillies", "Fried items & pakoras", "Alcohol & caffeine", "Raw salads during flare-ups", "Carbonated drinks"],
    tip: "Eat small meals every 3–4 hours. Stay hydrated. Avoid eating 2 hours before sleep."
  },
  "Dermatology": {
    foods: ["Vitamin C rich fruits (oranges, guava, amla)", "Colorful vegetables (carrots, tomatoes)", "Omega-3 fatty acids (fish, walnuts)", "Green tea", "Water (8-10 glasses/day)", "Sweet potatoes"],
    avoid: ["Excess dairy (may trigger acne)", "Sugary foods", "Processed & fried foods", "Alcohol", "Spicy food if rosacea"],
    tip: "Hydration is key for skin health. Sun protection and antioxidant-rich diet."
  },
  "Endocrinology": {
    foods: ["Low glycemic foods (whole grains, legumes)", "Non-starchy vegetables", "Lean proteins (chicken, fish, tofu)", "Nuts & seeds", "Bitter gourd & fenugreek", "Cinnamon & turmeric"],
    avoid: ["Refined sugars & white rice excess", "Processed foods & maida", "Fruit juices (eat whole fruits)", "Trans fats", "Excess starchy foods"],
    tip: "Monitor carbohydrate intake. Eat at regular times. Include fiber with every meal."
  },
  "Rheumatology": {
    foods: ["Fatty fish (anti-inflammatory omega-3)", "Colorful fruits & vegetables", "Olive oil & turmeric", "Whole grains", "Nuts (especially walnuts)", "Green tea"],
    avoid: ["Processed meats & red meat", "Refined sugars", "Excess salt", "Fried foods", "Nightshade vegetables if sensitive"],
    tip: "Anti-inflammatory diet is key. Consider eliminating trigger foods one at a time."
  },
  "General Medicine": {
    foods: ["Fresh fruits & seasonal vegetables", "Lean proteins (dal, chicken, fish, eggs)", "Whole grains (roti, brown rice, oats)", "Low-fat dairy (curd, buttermilk)", "Green tea & herbal teas"],
    avoid: ["Ultra-processed foods", "Excess sugar & refined carbs", "Trans fats & deep fried foods", "Excess salt"],
    tip: "Balanced diet with all food groups. 8 glasses of water daily. Regular meal times."
  },
  "Internal Medicine": {
    foods: ["Balanced mix of all food groups", "Fresh fruits & vegetables", "Lean proteins", "Whole grains", "Adequate hydration"],
    avoid: ["Excess processed foods", "High sodium diet", "Refined sugars", "Alcohol excess"],
    tip: "Follow your doctor's specific dietary instructions based on your condition."
  },
  "Psychiatry": {
    foods: ["Omega-3 rich foods (fish, walnuts)", "Complex carbohydrates (whole grains)", "Probiotic foods (yogurt, fermented foods)", "Dark chocolate (in moderation)", "Leafy greens & berries", "Turkey & bananas (tryptophan)"],
    avoid: ["Excess caffeine", "Alcohol", "Processed sugars", "Highly processed foods"],
    tip: "Gut-brain connection matters. Regular meals, adequate sleep, and omega-3s support mental health."
  },
  "default": {
    foods: ["Fresh seasonal fruits", "Mixed vegetables & salads", "Lean proteins (dal, eggs, fish)", "Whole grains (roti, rice)", "Plenty of water & herbal teas"],
    avoid: ["Processed foods & junk food", "Excess sugar & salt", "Alcohol & tobacco", "Trans fats"],
    tip: "Follow your doctor's specific dietary instructions. Maintain regular meal times."
  }
};
