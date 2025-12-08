export const PlanState = {
    current: null,
    hasUnsavedChanges: false,
    
    init(planData) {
        this.current = JSON.parse(JSON.stringify(planData)); 
        if(!this.current.days) this.current.days = [];
        this.current.duration = this.current.duration || 4;
        this.hasUnsavedChanges = false;
    },

    markChanged() { this.hasUnsavedChanges = true; },
    markSaved() { this.hasUnsavedChanges = false; },
    
    updateField(field, value) { this.current[field] = value; this.markChanged(); },
    
    addDay() { 
        this.current.days.push({ name: 'Nowy Dzień', exercises: [], collapsed: false }); 
        this.markChanged(); 
    },
    
    deleteDay(idx) { 
        this.current.days.splice(idx, 1); 
        this.markChanged(); 
    },
    
    toggleDay(idx) { 
        this.current.days[idx].collapsed = !this.current.days[idx].collapsed; 
    },
    
    addExercise(dayIdx, exData) {
        this.current.days[dayIdx].exercises.push(exData);
        this.markChanged();
    },
    
    removeExercise(dayIdx, exIdx) {
        this.current.days[dayIdx].exercises.splice(exIdx, 1);
        this.markChanged();
    },
    
    updateExercise(dayIdx, exIdx, field, val) {
        this.current.days[dayIdx].exercises[exIdx][field] = val;
        this.markChanged();
    }
};