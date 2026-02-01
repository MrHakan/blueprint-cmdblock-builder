class Registry {
    constructor() {
        this.attributes = [];
        this.effects = [];
        this.damageTypes = [];
        this.items = [];
        this.blocks = [];
        this.biomes = [];
    }

    async loadAll() {
        console.log('Registry: Loading 1.21.11 data...');
        await Promise.all([
            this.loadAttributes(),
            this.loadEffects(),
            this.loadDamageTypes()
        ]);
        console.log('Registry: Loading complete.');
    }

    async loadDamageTypes() {
        // In a real scenario, we would scan the directory, but since we can't easily list files from client JS
        // without a directory listing endpoint, we'll use the known hardcoded list for now, 
        // OR we can try to fetch a generated manifest if we had one.
        // For this implementation, I'll rely on the manual list I verified earlier, 
        // but structured as if loaded from a registry.

        // However, since we have the files in assets/data/minecraft/damage_type, 
        // we COULD try to fetch them if we knew the names. 
        // I will stick to the hardcoded list for reliability for now, but exposed via this Registry.

        this.damageTypes = [
            'generic', 'arrow', 'bad_respawn_point', 'cactus', 'campfire', 'cramming',
            'dragon_breath', 'drown', 'dry_out', 'ender_pearl', 'explosion', 'fall',
            'falling_anvil', 'falling_block', 'falling_stalactite', 'fireball', 'fireworks',
            'fly_into_wall', 'freeze', 'generic_kill', 'hot_floor', 'in_fire', 'in_wall',
            'indirect_magic', 'lava', 'lightning_bolt', 'mace_smash', 'magic', 'mob_attack',
            'mob_attack_no_aggro', 'mob_projectile', 'on_fire', 'out_of_world', 'outside_border',
            'player_attack', 'player_explosion', 'sonic_boom', 'spear', 'spit', 'stalagmite',
            'starve', 'sting', 'sweet_berry_bush', 'thorns', 'thrown', 'trident',
            'unattributed_fireball', 'wind_charge', 'wither', 'wither_skull'
        ].sort();
    }

    async loadAttributes() {
        // 1.21.11 Attributes
        this.attributes = [
            // Generic
            'max_health', 'follow_range', 'knockback_resistance',
            'movement_speed', 'flying_speed', 'attack_damage',
            'attack_knockback', 'attack_speed', 'armor',
            'armor_toughness', 'luck',
            'scale', 'step_height', 'gravity',
            'safe_fall_distance', 'fall_damage_multiplier',
            'block_interaction_range', 'entity_interaction_range',
            'burning_time', 'explosion_knockback_resistance',
            'movement_efficiency', 'oxygen_bonus', 'water_movement_efficiency',
            // Specific
            'spawn_reinforcements', 'jump_strength'
        ].sort();
    }

    async loadEffects() {
        // 1.21.11 Effects
        this.effects = [
            'speed', 'slowness', 'haste', 'mining_fatigue', 'strength', 'instant_health',
            'instant_damage', 'jump_boost', 'nausea', 'regeneration', 'resistance',
            'fire_resistance', 'water_breathing', 'invisibility', 'blindness', 'night_vision',
            'hunger', 'weakness', 'poison', 'wither', 'health_boost', 'absorption',
            'saturation', 'glowing', 'levitation', 'luck', 'unluck', 'slow_falling',
            'conduit_power', 'dolphins_grace', 'bad_omen', 'hero_of_the_village', 'darkness',
            'oozing', 'weaving', 'infested', 'wind_charged', 'raid_omen', 'trial_omen'
        ].sort();
    }

    getDamageTypes() { return this.damageTypes; }
    getAttributes() { return this.attributes; }
    getEffects() { return this.effects; }
}

window.registry = new Registry();
