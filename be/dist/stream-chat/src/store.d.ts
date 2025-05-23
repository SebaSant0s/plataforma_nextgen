export type Patch<T> = (value: T) => T;
export type ValueOrPatch<T> = T | Patch<T>;
export type Handler<T> = (nextValue: T, previousValue: T | undefined) => void;
export type Unsubscribe = () => void;
export declare const isPatch: <T>(value: ValueOrPatch<T>) => value is Patch<T>;
export declare class StateStore<T extends Record<string, unknown>> {
    private value;
    private handlerSet;
    private static logCount;
    constructor(value: T);
    next: (newValueOrPatch: ValueOrPatch<T>) => void;
    partialNext: (partial: Partial<T>) => void;
    getLatestValue: () => T;
    subscribe: (handler: Handler<T>) => Unsubscribe;
    subscribeWithSelector: <O extends Readonly<Record<string, unknown>> | Readonly<unknown[]>>(selector: (nextValue: T) => O, handler: Handler<O>) => Unsubscribe;
}
//# sourceMappingURL=store.d.ts.map