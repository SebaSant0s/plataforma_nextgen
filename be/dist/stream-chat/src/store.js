"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateStore = exports.isPatch = void 0;
const isPatch = (value) => {
    return typeof value === 'function';
};
exports.isPatch = isPatch;
class StateStore {
    constructor(value) {
        this.value = value;
        this.handlerSet = new Set();
        this.next = (newValueOrPatch) => {
            // newValue (or patch output) should never be mutated previous value
            const newValue = (0, exports.isPatch)(newValueOrPatch) ? newValueOrPatch(this.value) : newValueOrPatch;
            // do not notify subscribers if the value hasn't changed
            if (newValue === this.value)
                return;
            const oldValue = this.value;
            this.value = newValue;
            this.handlerSet.forEach((handler) => handler(this.value, oldValue));
        };
        this.partialNext = (partial) => this.next((current) => ({ ...current, ...partial }));
        this.getLatestValue = () => this.value;
        this.subscribe = (handler) => {
            handler(this.value, undefined);
            this.handlerSet.add(handler);
            return () => {
                this.handlerSet.delete(handler);
            };
        };
        this.subscribeWithSelector = (selector, handler) => {
            // begin with undefined to reduce amount of selector calls
            let selectedValues;
            const wrappedHandler = (nextValue) => {
                const newlySelectedValues = selector(nextValue);
                let hasUpdatedValues = !selectedValues;
                if (Array.isArray(newlySelectedValues) && StateStore.logCount > 0) {
                    console.warn('[StreamChat]: The API of our StateStore has changed. Instead of returning an array in the selector, please return a named object of properties.');
                    StateStore.logCount--;
                }
                for (const key in selectedValues) {
                    // @ts-ignore TODO: remove array support (Readonly<unknown[]>)
                    if (selectedValues[key] === newlySelectedValues[key])
                        continue;
                    hasUpdatedValues = true;
                    break;
                }
                if (!hasUpdatedValues)
                    return;
                const oldSelectedValues = selectedValues;
                selectedValues = newlySelectedValues;
                handler(newlySelectedValues, oldSelectedValues);
            };
            return this.subscribe(wrappedHandler);
        };
    }
}
exports.StateStore = StateStore;
StateStore.logCount = 5;
