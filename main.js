/**
 * Created by LOMS on 02.01.2017.
 */
'use strict';

var roles = require('roles');

var Harvester = new roles.Harvester;
var Upgrader = new roles.Upgrader;
var Builder = new roles.Builder;
var Repairer = new roles.Repairer;

function getDigitalTime() {
    let date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();
    if (h < 10) h = "0" + h;
    if (m < 10) m = "0" + m;
    if (s < 10) m = "0" + s;
    return h + "." + m + "." + s;
}

/**
 * Make creep of certain role & bodyparts if quantity of existing ones is below given limit.
 * @param spawn
 * @param params
 * @param role
 * @param limit
 */
function makeCreep(spawn, params, role, limit) {
    let creepCount = _.sum(Game.creeps, (c) => c.memory.role == role);
    let creepName = role + "_" + getDigitalTime();
    if (0 + creepCount >= limit) {
        return;
    }
    let spawned = spawn.createCreep(params, creepName, {role: role});

    if (spawned == -3) console.log("Spawner can't spawn! Name exists! " + creepName);

    if (spawned instanceof String) {
        console.log("Spawned creep " + spawned + " role - " + role);
    }
}

function makeHarvester(spawn, limit) {
    makeCreep(spawn, [WORK, WORK, WORK, MOVE, MOVE, CARRY, CARRY], 'harvester', limit);
}

function makeUpgrader(spawn, limit) {
    makeCreep(spawn, [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], 'upgrader', limit);
}

function makeBuilder(spawn, limit) {
    makeCreep(spawn, [WORK, WORK, WORK, MOVE, MOVE, CARRY, CARRY, CARRY], 'builder', limit);
}


/**
 * Spawns creep of certain type, keeps them at chosen population, applies control actions to it.
 * @param spawner - known spawner.
 * @param role {String} - role name.
 * @param controller - instance of controller class. Like, Harvester, Builder etc.
 * @param spawnFunction - function to spawn creep.
 * @param maxPopulation - max population of creeps with chosen role.
 */
function creepController(spawner, role, controller, spawnFunction, maxPopulation) {
    spawnFunction(spawner, maxPopulation);
    let creeps = _.filter(Game.creeps, (c) => c.memory.role == role);
    creeps.forEach(function (creep) {
        controller.work(creep);
    });
}

function gc() {
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }
}

function towerShooter() {
    let towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_TOWER
    });
    for (let tower of towers) {
        let target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target != undefined) {
            tower.attack(target);
        }
    }
}

module.exports.loop = function () {
    console.log("tick.");
    gc();
    let spawner = Game.spawns.Spawn1;
    creepController(spawner, 'harvester', Harvester, makeHarvester, 4);
    creepController(spawner, 'builder', Builder, makeBuilder, 2);
    creepController(spawner, 'upgrader', Upgrader, makeUpgrader, 10);
    creepController(spawner, 'repairer', Repairer, makeBuilder, 1);
    towerShooter();
};