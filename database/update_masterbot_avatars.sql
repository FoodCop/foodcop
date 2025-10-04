-- Update masterbot avatars with direct public URLs
-- These will be served from the public folder

UPDATE users SET avatar_url = '/masterbot-avatars/anika_spice_scholar.png'
WHERE username = 'spice_scholar_anika' AND is_master_bot = true;

UPDATE users SET avatar_url = '/masterbot-avatars/sebastian_sommelier.png'  
WHERE username = 'sommelier_seb' AND is_master_bot = true;

UPDATE users SET avatar_url = '/masterbot-avatars/omar_coffee_pilgrim.png'
WHERE username = 'coffee_pilgrim_omar' AND is_master_bot = true;

UPDATE users SET avatar_url = '/masterbot-avatars/jun_zen_minimalist.png'
WHERE username = 'zen_minimalist_jun' AND is_master_bot = true;

UPDATE users SET avatar_url = '/masterbot-avatars/aurelia_nomad.png'
WHERE username = 'nomad_aurelia' AND is_master_bot = true;

UPDATE users SET avatar_url = '/masterbot-avatars/rafael_adventure.png'
WHERE username = 'adventure_rafa' AND is_master_bot = true;

UPDATE users SET avatar_url = '/masterbot-avatars/lila_plant_pioneer.png'
WHERE username = 'plant_pioneer_lila' AND is_master_bot = true;