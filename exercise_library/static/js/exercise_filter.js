var Exercise = Backbone.Model.extend({
});

var ExerciseCollection = Backbone.Collection.extend({
    model: Exercise
});

var Filter = Backbone.Model.extend({
    constructor: function (){
        var attrs = [{
            'equipmentIds': [],
            'muscleGroupId': 1,
            'fitnessLevel': 1,
            'experience': 1,
            'exerciseTypes': []
        }];
        Backbone.Model.apply(this, attrs);
    }
});

var ExerciseListView = Backbone.View.extend({
    initialize: function(filter, collection){
        this.template = _.template($("#exercise-list-view").html());
        this.filter = filter;
        this.collection = collection;
        this.filteredCollection = collection;
        this.listenTo(this.filter, "change", this.render);
    },
    _getFilteredCollection: function(){

        var filteredCollection = this.collection.where({
            muscle_group_id: this.filter.get("muscleGroupId")
        });
        var availableEquipment = [];
        for(var i=0; i<this.filter.get("equipmentIds").length; i++){
            var equipmentIdStr = this.filter.get("equipmentIds")[i];
            availableEquipment.push(parseInt(equipmentIdStr, 10));
        }
        filteredCollection = filteredCollection.filter(function(model){
            var requiredEquipment = model.get("equipment_ids");
            for(var requiredIndex=0; requiredIndex<requiredEquipment.length; requiredIndex++){
                var requiredEquipmentId = requiredEquipment[requiredIndex];
                if(_.indexOf(availableEquipment, requiredEquipmentId) === -1){
                    return false;
                }
            }
            return true;
        });
        var exerciseTypes = [];
        for(var i=0; i<this.filter.get("exerciseTypes").length; i++){
            var exerciseTypeStr = this.filter.get("exerciseTypes")[i];
            exerciseTypes.push(parseInt(exerciseTypeStr, 10));
        }
        filteredCollection = filteredCollection.filter(function(model){
            var exerciseTypeIds = model.get("exercise_type_ids");
            for(var i=0; i<exerciseTypeIds.length; i++){
                var exerciseTypeId = exerciseTypeIds[i];
                if(_.indexOf(exerciseTypes, exerciseTypeId) === -1){
                    return false;
                }
            }
            return true;
        });
        return filteredCollection;
    },
    render: function(){
        // var renderData = this.filteredCollection.toJSON();
        var exerciseList = this._getFilteredCollection();
        var jsonExerciseList = [];

        var selectedMuscleName = "";
        var muscleId = this.filter.get("muscleGroupId");
        for(var i=0; i<JSContext.muscle_groups.length; i++){
            var muscleGroup = JSContext.muscle_groups[i];
            if (muscleGroup.id === muscleId){
                selectedMuscleName = muscleGroup.title;
            }
        }

        for(var i=0; i<exerciseList.length; i++){
            var model = exerciseList[i];
            jsonExerciseList.push(model.toJSON());
        }
        jsonExerciseList.sort(function(a, b){
            return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
        });
        var renderData = {
            "selectedMuscleName": selectedMuscleName,
            "exercises": jsonExerciseList
        };
        console.log(renderData);
        this.$el.html(this.template(renderData));
        return this;
    }
});

var ExerciseFilterView = Backbone.View.extend({
    events: {
        "click input[type='checkbox']": "changeFilter",
        "click a": "linkClick"
    },
    initialize: function(el, collection){
        this.template = _.template($("#exercise-filter-view").html());
        this.$el = el;
        this.collection = collection;
        this.allEquipment = JSContext.equipment;
        this.allMuscleGroups = JSContext.muscle_groups;
        this.allExerciseTypes = JSContext.exercise_types;
        this.filter = new Filter();
        this.exerciseListView = new ExerciseListView(this.filter, this.collection);
    },
    linkClick: function(evt){
        var idString = evt.target.id;
        var splitArray = idString.split("_");
        if(splitArray[0] === "muscle"){
            var muscleId = parseInt(splitArray[1], 10);
            this.filter.set("muscleGroupId", muscleId);
            this.filter.trigger("change");
        }
    },
    changeFilter: function(){
        this.updateFilterFromView();
    },
    updateFilterFromView: function(){
        var equipmentIds = [];
        this.$(".equipment-check").filter(":checked").each(function(){
            var elId = this.id;
            equipmentIds.push(elId.split("_")[1]);
        });

        var exerciseTypeIds = [];
        this.$(".exercise-type-check").filter(":checked").each(function(){
            var elId = this.id;
            exerciseTypeIds.push(elId.split("_")[1]);
        });
        this.filter.set("equipmentIds", equipmentIds);
        this.filter.set("exerciseTypes", exerciseTypeIds);
        this.filter.trigger("change");
    },
    render: function(){
        var renderData = {
            equipments: this.allEquipment,
            exerciseTypes: this.allExerciseTypes,
            muscleGroups: this.allMuscleGroups
        };
        this.$el.html(this.template(renderData));

        this.$(".tab-inner-content").html(this.exerciseListView.render().el);

        this.updateFilterFromView();
        return this;
    }
});