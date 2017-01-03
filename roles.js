class CreepIntel {

    work(){
    }

    assertCreep(creep) {
        if (creep instanceof Creep) {
            return true;
        }
        console.log("Given variable " + creep + "is not instance of creep");
    }

    getSpawn(name) {
        return Game.spawns[name];
    }
}

class Harvester extends CreepIntel {
    setHarvestState(state) {
        this.creep.memory.harvesting = state;
    }

    getHarvestState() {
        return Boolean(this.creep.memory.harvesting);
    }

    getEnergyAcceptor() {
        return this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (c) => c.energy < c.energyCapacity
        });
    }

    /**
     * Do certain action, if not in range - move closer.
     * @param action {String} - action (method) of creep.
     * @param target - target to perform action.
     * @param args - optional arguments for action
     * @returns {*}
     */
    doSomething(action, target, args) {
        // console.log("Action is " + typeof action + " and this " + action);
        let result = this.creep[action](target, args);
        // console.log("result " + result);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target);
            return 0;
        }
        if (result == ERR_INVALID_ARGS) {
            console.log("CREEP " + this.creep.name + " (" + this.creep.memory.role + ") GOT INVALID ARGUMENTS IN DO SOMETHING " + action);
        }
        return result;
    }

    transferEnergy() {
        if (this.creep.role == "harvester") console.log("transfer energy");
        if (this.isEmpty()) {
            this.setHarvestState(true);
            return;
        }
        var storage = this.getEnergyAcceptor();

        if (storage == undefined) {
            this.creep.moveTo(Game.spawns.Spawn1);
            return 1;
        }

        // let transfer_result  = this.creep.transfer(storage, RESOURCE_ENERGY);
        let transfer_result = this.doSomething("transfer", storage, RESOURCE_ENERGY);
        if (transfer_result == ERR_INVALID_TARGET) {
            console.log("ERROR! Creep cannot transfer resources to " + storage);
            return 1;
        }
        return transfer_result;
    }

    isFull() {
        return this.creep.carry.energy == this.creep.carryCapacity;
    }

    isEmpty() {
        return this.creep.carry.energy == 0;
    }

    mineEnergy() {
        let energySource = this.creep.pos.findClosestByPath(FIND_SOURCES, {
            filter: (s) => s.energy > 0
        });
        this.doSomething("harvest", energySource);
    }

    workAction() {
        let result = this.transferEnergy();
    }

    work(creep) {
        if (!this.assertCreep(creep)) return;
        this.creep = creep;
        if (this.isFull()) {
            this.setHarvestState(false);
        }
        if (this.getHarvestState()) {
            this.mineEnergy();
        } else {
            this.workAction();
        }
    }
}

class Upgrader extends Harvester {
    getEnergyAcceptor() {
        // console.log("Energy acceptor for upgrader = " + this.creep.room.controller);/
        // if (this.creep.room.energyAvailable < 300)
        //     return super.getEnergyAcceptor();
        return this.creep.room.controller;
    }
}

class Builder extends Harvester {

    doBuild() {
        let constructionSite =  this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (constructionSite == undefined) return 1;
        return this.doSomething("build", constructionSite);
    }

    doRepair() {
        let construction = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax && s.structureType != STRUCTURE_WALL
        });
        if (construction == undefined) {
            return 1;
        }
        return this.doSomething("repair", construction);

        let error = this.creep.repair(construction);
        if (error == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(construction);
        } else if (error != 0){
            console.log("repair error " + error);
            return 1;
        }
        return 0;
    }

    workAction() {
        if (this.doBuild() == 0) return 0;
        if (this.doRepair() == 0) return 0;
        if (this.transferEnergy() ==0) return 0;
        return 1;
    }
}

class Repairer extends Builder {
    workAction() {
        if (this.doRepair() == 0) return 0;
        if (this.doBuild() == 0) return 0;
        if (this.transferEnergy() ==0) return 0;
        return 1;
    }
}

// =====================================================================================================================
// Always bottom.
module.exports = {
    Harvester: Harvester,
    Upgrader: Upgrader,
    Builder: Builder,
    Repairer: Repairer
};
