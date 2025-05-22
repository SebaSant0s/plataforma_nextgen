"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteChannel = exports.findLastPinnedChannelIndex = exports.findPinnedAtSortOrder = exports.shouldConsiderPinnedChannels = exports.extractSortValue = exports.shouldConsiderArchivedChannels = exports.isChannelArchived = exports.isChannelPinned = exports.generateChannelTempCid = exports.getAndWatchChannel = exports.messageSetPagination = exports.uniqBy = exports.throttle = exports.debounce = exports.findIndexInSortedArray = exports.axiosParamsSerializer = exports.chatCodes = exports.sleep = void 0;
exports.logChatPromiseExecution = logChatPromiseExecution;
exports.isFunction = isFunction;
exports.isOwnUser = isOwnUser;
exports.isOwnUserBaseProperty = isOwnUserBaseProperty;
exports.addFileToFormData = addFileToFormData;
exports.normalizeQuerySort = normalizeQuerySort;
exports.retryInterval = retryInterval;
exports.randomId = randomId;
exports.generateUUIDv4 = generateUUIDv4;
exports.convertErrorToJson = convertErrorToJson;
exports.isOnline = isOnline;
exports.addConnectionEventListeners = addConnectionEventListeners;
exports.removeConnectionEventListeners = removeConnectionEventListeners;
exports.formatMessage = formatMessage;
exports.addToMessageList = addToMessageList;
exports.binarySearchByDateEqualOrNearestGreater = binarySearchByDateEqualOrNearestGreater;
const form_data_1 = __importDefault(require("form-data"));
/**
 * logChatPromiseExecution - utility function for logging the execution of a promise..
 *  use this when you want to run the promise and handle errors by logging a warning
 *
 * @param {Promise<T>} promise The promise you want to run and log
 * @param {string} name    A descriptive name of what the promise does for log output
 *
 */
function logChatPromiseExecution(promise, name) {
    promise.then().catch((error) => {
        console.warn(`failed to do ${name}, ran into error: `, error);
    });
}
const sleep = (m) => new Promise((r) => setTimeout(r, m));
exports.sleep = sleep;
function isFunction(value) {
    return (value &&
        (Object.prototype.toString.call(value) === '[object Function]' ||
            'function' === typeof value ||
            value instanceof Function));
}
exports.chatCodes = {
    TOKEN_EXPIRED: 40,
    WS_CLOSED_SUCCESS: 1000,
};
function isReadableStream(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        (obj.readable || typeof obj._read === 'function'));
}
function isBuffer(obj) {
    return (obj != null &&
        obj.constructor != null &&
        // @ts-expect-error
        typeof obj.constructor.isBuffer === 'function' &&
        // @ts-expect-error
        obj.constructor.isBuffer(obj));
}
function isFileWebAPI(uri) {
    return typeof window !== 'undefined' && 'File' in window && uri instanceof File;
}
function isOwnUser(user) {
    return user?.total_unread_count !== undefined;
}
function isBlobWebAPI(uri) {
    return typeof window !== 'undefined' && 'Blob' in window && uri instanceof Blob;
}
function isOwnUserBaseProperty(property) {
    const ownUserBaseProperties = {
        channel_mutes: true,
        devices: true,
        mutes: true,
        total_unread_count: true,
        unread_channels: true,
        unread_count: true,
        unread_threads: true,
        invisible: true,
        privacy_settings: true,
        roles: true,
        push_preferences: true,
    };
    return ownUserBaseProperties[property];
}
function addFileToFormData(uri, name, contentType) {
    const data = new form_data_1.default();
    if (isReadableStream(uri) || isBuffer(uri) || isFileWebAPI(uri) || isBlobWebAPI(uri)) {
        if (name)
            data.append('file', uri, name);
        else
            data.append('file', uri);
    }
    else {
        data.append('file', {
            uri,
            name: name || uri.split('/').reverse()[0],
            contentType: contentType || undefined,
            type: contentType || undefined,
        });
    }
    return data;
}
function normalizeQuerySort(sort) {
    const sortFields = [];
    const sortArr = Array.isArray(sort) ? sort : [sort];
    for (const item of sortArr) {
        const entries = Object.entries(item);
        if (entries.length > 1) {
            console.warn("client._buildSort() - multiple fields in a single sort object detected. Object's field order is not guaranteed");
        }
        for (const [field, direction] of entries) {
            sortFields.push({ field, direction });
        }
    }
    return sortFields;
}
/**
 * retryInterval - A retry interval which increases acc to number of failures
 *
 * @return {number} Duration to wait in milliseconds
 */
function retryInterval(numberOfFailures) {
    // try to reconnect in 0.25-25 seconds (random to spread out the load from failures)
    const max = Math.min(500 + numberOfFailures * 2000, 25000);
    const min = Math.min(Math.max(250, (numberOfFailures - 1) * 2000), 25000);
    return Math.floor(Math.random() * (max - min) + min);
}
function randomId() {
    return generateUUIDv4();
}
function hex(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) {
        s += bytes[i].toString(16).padStart(2, '0');
    }
    return s;
}
// https://tools.ietf.org/html/rfc4122
function generateUUIDv4() {
    const bytes = getRandomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version
    bytes[8] = (bytes[8] & 0xbf) | 0x80; // variant
    return (hex(bytes.subarray(0, 4)) +
        '-' +
        hex(bytes.subarray(4, 6)) +
        '-' +
        hex(bytes.subarray(6, 8)) +
        '-' +
        hex(bytes.subarray(8, 10)) +
        '-' +
        hex(bytes.subarray(10, 16)));
}
function getRandomValuesWithMathRandom(bytes) {
    const max = Math.pow(2, (8 * bytes.byteLength) / bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.random() * max;
    }
}
const getRandomValues = (() => {
    if (typeof crypto !== 'undefined' && typeof crypto?.getRandomValues !== 'undefined') {
        return crypto.getRandomValues.bind(crypto);
    }
    else if (typeof msCrypto !== 'undefined') {
        return msCrypto.getRandomValues.bind(msCrypto);
    }
    else {
        return getRandomValuesWithMathRandom;
    }
})();
function getRandomBytes(length) {
    const bytes = new Uint8Array(length);
    getRandomValues(bytes);
    return bytes;
}
function convertErrorToJson(err) {
    const jsonObj = {};
    if (!err)
        return jsonObj;
    try {
        Object.getOwnPropertyNames(err).forEach((key) => {
            jsonObj[key] = Object.getOwnPropertyDescriptor(err, key);
        });
    }
    catch (_) {
        return {
            error: 'failed to serialize the error',
        };
    }
    return jsonObj;
}
/**
 * isOnline safely return the navigator.online value for browser env
 * if navigator is not in global object, it always return true
 */
function isOnline() {
    const nav = typeof navigator !== 'undefined'
        ? navigator
        : typeof window !== 'undefined' && window.navigator
            ? window.navigator
            : undefined;
    if (!nav) {
        console.warn('isOnline failed to access window.navigator and assume browser is online');
        return true;
    }
    // RN navigator has undefined for onLine
    if (typeof nav.onLine !== 'boolean') {
        return true;
    }
    return nav.onLine;
}
/**
 * listenForConnectionChanges - Adds an event listener fired on browser going online or offline
 */
function addConnectionEventListeners(cb) {
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('offline', cb);
        window.addEventListener('online', cb);
    }
}
function removeConnectionEventListeners(cb) {
    if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('offline', cb);
        window.removeEventListener('online', cb);
    }
}
const axiosParamsSerializer = (params) => {
    const newParams = [];
    for (const k in params) {
        // Stream backend doesn't treat "undefined" value same as value not being present.
        // So, we need to skip the undefined values.
        if (params[k] === undefined)
            continue;
        if (Array.isArray(params[k]) || typeof params[k] === 'object') {
            newParams.push(`${k}=${encodeURIComponent(JSON.stringify(params[k]))}`);
        }
        else {
            newParams.push(`${k}=${encodeURIComponent(params[k])}`);
        }
    }
    return newParams.join('&');
};
exports.axiosParamsSerializer = axiosParamsSerializer;
/**
 * Takes the message object, parses the dates, sets `__html`
 * and sets the status to `received` if missing; returns a new message object.
 *
 * @param {MessageResponse<StreamChatGenerics>} message `MessageResponse` object
 */
function formatMessage(message) {
    return {
        ...message,
        /**
         * @deprecated please use `html`
         */
        __html: message.html,
        // parse the dates
        pinned_at: message.pinned_at ? new Date(message.pinned_at) : null,
        created_at: message.created_at ? new Date(message.created_at) : new Date(),
        updated_at: message.updated_at ? new Date(message.updated_at) : new Date(),
        deleted_at: message.deleted_at ? new Date(message.deleted_at) : null,
        status: message.status || 'received',
        reaction_groups: maybeGetReactionGroupsFallback(message.reaction_groups, message.reaction_counts, message.reaction_scores),
    };
}
const findIndexInSortedArray = ({ needle, sortedArray, selectKey, selectValueToCompare = (e) => e, sortDirection = 'ascending', }) => {
    if (!sortedArray.length)
        return 0;
    let left = 0;
    let right = sortedArray.length - 1;
    let middle = 0;
    const recalculateMiddle = () => {
        middle = Math.round((left + right) / 2);
    };
    const comparableNeedle = selectValueToCompare(needle);
    while (left <= right) {
        recalculateMiddle();
        const comparableMiddle = selectValueToCompare(sortedArray[middle]);
        if ((sortDirection === 'ascending' && comparableNeedle < comparableMiddle) ||
            (sortDirection === 'descending' && comparableNeedle >= comparableMiddle)) {
            right = middle - 1;
        }
        else {
            left = middle + 1;
        }
    }
    // In case there are several array elements with the same comparable value, search around the insertion
    // point to possibly find an element with the same key. If found, prefer it.
    // This, for example, prevents duplication of messages with the same creation date.
    if (selectKey) {
        const needleKey = selectKey(needle);
        const step = sortDirection === 'ascending' ? -1 : +1;
        for (let i = left + step; 0 <= i && i < sortedArray.length && selectValueToCompare(sortedArray[i]) === comparableNeedle; i += step) {
            if (selectKey(sortedArray[i]) === needleKey) {
                return i;
            }
        }
    }
    return left;
};
exports.findIndexInSortedArray = findIndexInSortedArray;
function addToMessageList(messages, newMessage, timestampChanged = false, sortBy = 'created_at', addIfDoesNotExist = true) {
    const addMessageToList = addIfDoesNotExist || timestampChanged;
    let newMessages = [...messages];
    // if created_at has changed, message should be filtered and re-inserted in correct order
    // slow op but usually this only happens for a message inserted to state before actual response with correct timestamp
    if (timestampChanged) {
        newMessages = newMessages.filter((message) => !(message.id && newMessage.id === message.id));
    }
    // for empty list just concat and return unless it's an update or deletion
    if (newMessages.length === 0 && addMessageToList) {
        return newMessages.concat(newMessage);
    }
    else if (newMessages.length === 0) {
        return newMessages;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const messageTime = newMessage[sortBy].getTime();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const messageIsNewest = newMessages.at(-1)[sortBy].getTime() < messageTime;
    // if message is newer than last item in the list concat and return unless it's an update or deletion
    if (messageIsNewest && addMessageToList) {
        return newMessages.concat(newMessage);
    }
    else if (messageIsNewest) {
        return newMessages;
    }
    // find the closest index to push the new message
    const insertionIndex = (0, exports.findIndexInSortedArray)({
        needle: newMessage,
        sortedArray: newMessages,
        sortDirection: 'ascending',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        selectValueToCompare: (m) => m[sortBy].getTime(),
        selectKey: (m) => m.id,
    });
    // message already exists and not filtered with timestampChanged, update and return
    if (!timestampChanged &&
        newMessage.id &&
        newMessages[insertionIndex] &&
        newMessage.id === newMessages[insertionIndex].id) {
        newMessages[insertionIndex] = newMessage;
        return newMessages;
    }
    // do not add updated or deleted messages to the list if they already exist or come with a timestamp change
    if (addMessageToList) {
        newMessages.splice(insertionIndex, 0, newMessage);
    }
    return newMessages;
}
function maybeGetReactionGroupsFallback(groups, counts, scores) {
    if (groups) {
        return groups;
    }
    if (counts && scores) {
        const fallback = {};
        for (const type of Object.keys(counts)) {
            fallback[type] = {
                count: counts[type],
                sum_scores: scores[type],
            };
        }
        return fallback;
    }
    return null;
}
// works exactly the same as lodash.debounce
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = (fn, timeout = 0, { leading = false, trailing = true } = {}) => {
    let runningTimeout = null;
    let argsForTrailingExecution = null;
    let lastResult;
    const debouncedFn = (...args) => {
        if (runningTimeout) {
            clearTimeout(runningTimeout);
        }
        else if (leading) {
            lastResult = fn(...args);
        }
        if (trailing)
            argsForTrailingExecution = args;
        const timeoutHandler = () => {
            if (argsForTrailingExecution) {
                lastResult = fn(...argsForTrailingExecution);
                argsForTrailingExecution = null;
            }
            runningTimeout = null;
        };
        runningTimeout = setTimeout(timeoutHandler, timeout);
        return lastResult;
    };
    debouncedFn.cancel = () => {
        if (runningTimeout)
            clearTimeout(runningTimeout);
    };
    debouncedFn.flush = () => {
        if (runningTimeout) {
            clearTimeout(runningTimeout);
            runningTimeout = null;
            if (argsForTrailingExecution) {
                lastResult = fn(...argsForTrailingExecution);
            }
        }
        return lastResult;
    };
    return debouncedFn;
};
exports.debounce = debounce;
// works exactly the same as lodash.throttle
const throttle = (fn, timeout = 200, { leading = true, trailing = false } = {}) => {
    let runningTimeout = null;
    let storedArgs = null;
    return (...args) => {
        if (runningTimeout) {
            if (trailing)
                storedArgs = args;
            return;
        }
        if (leading)
            fn(...args);
        const timeoutHandler = () => {
            if (storedArgs) {
                fn(...storedArgs);
                storedArgs = null;
                runningTimeout = setTimeout(timeoutHandler, timeout);
                return;
            }
            runningTimeout = null;
        };
        runningTimeout = setTimeout(timeoutHandler, timeout);
    };
};
exports.throttle = throttle;
const get = (obj, path) => path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
        return acc[key];
    }
    return undefined;
}, obj);
// works exactly the same as lodash.uniqBy
const uniqBy = (array, iteratee) => {
    if (!Array.isArray(array))
        return [];
    const seen = new Set();
    return array.filter((item) => {
        const key = typeof iteratee === 'function' ? iteratee(item) : get(item, iteratee);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
exports.uniqBy = uniqBy;
function binarySearchByDateEqualOrNearestGreater(array, targetDate) {
    let left = 0;
    let right = array.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midCreatedAt = array[mid].created_at;
        if (!midCreatedAt) {
            left += 1;
            continue;
        }
        const midDate = new Date(midCreatedAt);
        if (midDate.getTime() === targetDate.getTime()) {
            return mid;
        }
        else if (midDate.getTime() < targetDate.getTime()) {
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }
    return left;
}
const messagePaginationCreatedAtAround = ({ parentSet, requestedPageSize, returnedPage, messagePaginationOptions, }) => {
    const newPagination = { ...parentSet.pagination };
    if (!messagePaginationOptions?.created_at_around)
        return newPagination;
    let hasPrev;
    let hasNext;
    let updateHasPrev;
    let updateHasNext;
    const createdAtAroundDate = new Date(messagePaginationOptions.created_at_around);
    const [firstPageMsg, lastPageMsg] = [returnedPage[0], returnedPage.slice(-1)[0]];
    // expect ASC order (from oldest to newest)
    const wholePageHasNewerMessages = !!firstPageMsg?.created_at && new Date(firstPageMsg.created_at) > createdAtAroundDate;
    const wholePageHasOlderMessages = !!lastPageMsg?.created_at && new Date(lastPageMsg.created_at) < createdAtAroundDate;
    const requestedPageSizeNotMet = requestedPageSize > parentSet.messages.length && requestedPageSize > returnedPage.length;
    const noMoreMessages = (requestedPageSize > parentSet.messages.length || parentSet.messages.length >= returnedPage.length) &&
        requestedPageSize > returnedPage.length;
    if (wholePageHasNewerMessages) {
        hasPrev = false;
        updateHasPrev = true;
        if (requestedPageSizeNotMet) {
            hasNext = false;
            updateHasNext = true;
        }
    }
    else if (wholePageHasOlderMessages) {
        hasNext = false;
        updateHasNext = true;
        if (requestedPageSizeNotMet) {
            hasPrev = false;
            updateHasPrev = true;
        }
    }
    else if (noMoreMessages) {
        hasNext = hasPrev = false;
        updateHasPrev = updateHasNext = true;
    }
    else {
        const [firstPageMsgIsFirstInSet, lastPageMsgIsLastInSet] = [
            firstPageMsg?.id && firstPageMsg.id === parentSet.messages[0]?.id,
            lastPageMsg?.id && lastPageMsg.id === parentSet.messages.slice(-1)[0]?.id,
        ];
        updateHasPrev = firstPageMsgIsFirstInSet;
        updateHasNext = lastPageMsgIsLastInSet;
        const midPointByCount = Math.floor(returnedPage.length / 2);
        const midPointByCreationDate = binarySearchByDateEqualOrNearestGreater(returnedPage, createdAtAroundDate);
        if (midPointByCreationDate !== -1) {
            hasPrev = midPointByCount <= midPointByCreationDate;
            hasNext = midPointByCount >= midPointByCreationDate;
        }
    }
    if (updateHasPrev && typeof hasPrev !== 'undefined')
        newPagination.hasPrev = hasPrev;
    if (updateHasNext && typeof hasNext !== 'undefined')
        newPagination.hasNext = hasNext;
    return newPagination;
};
const messagePaginationIdAround = ({ parentSet, requestedPageSize, returnedPage, messagePaginationOptions, }) => {
    const newPagination = { ...parentSet.pagination };
    const { id_around } = messagePaginationOptions || {};
    if (!id_around)
        return newPagination;
    let hasPrev;
    let hasNext;
    const [firstPageMsg, lastPageMsg] = [returnedPage[0], returnedPage.slice(-1)[0]];
    const [firstPageMsgIsFirstInSet, lastPageMsgIsLastInSet] = [
        firstPageMsg?.id === parentSet.messages[0]?.id,
        lastPageMsg?.id === parentSet.messages.slice(-1)[0]?.id,
    ];
    let updateHasPrev = firstPageMsgIsFirstInSet;
    let updateHasNext = lastPageMsgIsLastInSet;
    const midPoint = Math.floor(returnedPage.length / 2);
    const noMoreMessages = (requestedPageSize > parentSet.messages.length || parentSet.messages.length >= returnedPage.length) &&
        requestedPageSize > returnedPage.length;
    if (noMoreMessages) {
        hasNext = hasPrev = false;
        updateHasPrev = updateHasNext = true;
    }
    else if (!returnedPage[midPoint]) {
        return newPagination;
    }
    else if (returnedPage[midPoint].id === id_around) {
        hasPrev = hasNext = true;
    }
    else {
        let targetMsg;
        const halves = [returnedPage.slice(0, midPoint), returnedPage.slice(midPoint)];
        hasPrev = hasNext = true;
        for (let i = 0; i < halves.length; i++) {
            targetMsg = halves[i].find((message) => message.id === id_around);
            if (targetMsg && i === 0) {
                hasPrev = false;
            }
            if (targetMsg && i === 1) {
                hasNext = false;
            }
        }
    }
    if (updateHasPrev && typeof hasPrev !== 'undefined')
        newPagination.hasPrev = hasPrev;
    if (updateHasNext && typeof hasNext !== 'undefined')
        newPagination.hasNext = hasNext;
    return newPagination;
};
const messagePaginationLinear = ({ parentSet, requestedPageSize, returnedPage, messagePaginationOptions, }) => {
    const newPagination = { ...parentSet.pagination };
    let hasPrev;
    let hasNext;
    const [firstPageMsg, lastPageMsg] = [returnedPage[0], returnedPage.slice(-1)[0]];
    const [firstPageMsgIsFirstInSet, lastPageMsgIsLastInSet] = [
        firstPageMsg?.id && firstPageMsg.id === parentSet.messages[0]?.id,
        lastPageMsg?.id && lastPageMsg.id === parentSet.messages.slice(-1)[0]?.id,
    ];
    const queriedNextMessages = messagePaginationOptions &&
        (messagePaginationOptions.created_at_after_or_equal ||
            messagePaginationOptions.created_at_after ||
            messagePaginationOptions.id_gt ||
            messagePaginationOptions.id_gte);
    const queriedPrevMessages = typeof messagePaginationOptions === 'undefined'
        ? true
        : messagePaginationOptions.created_at_before_or_equal ||
            messagePaginationOptions.created_at_before ||
            messagePaginationOptions.id_lt ||
            messagePaginationOptions.id_lte ||
            messagePaginationOptions.offset;
    const containsUnrecognizedOptionsOnly = !queriedNextMessages &&
        !queriedPrevMessages &&
        !messagePaginationOptions?.id_around &&
        !messagePaginationOptions?.created_at_around;
    const hasMore = returnedPage.length >= requestedPageSize;
    if (typeof queriedPrevMessages !== 'undefined' || containsUnrecognizedOptionsOnly) {
        hasPrev = hasMore;
    }
    if (typeof queriedNextMessages !== 'undefined') {
        hasNext = hasMore;
    }
    const returnedPageIsEmpty = returnedPage.length === 0;
    if ((firstPageMsgIsFirstInSet || returnedPageIsEmpty) && typeof hasPrev !== 'undefined')
        newPagination.hasPrev = hasPrev;
    if ((lastPageMsgIsLastInSet || returnedPageIsEmpty) && typeof hasNext !== 'undefined')
        newPagination.hasNext = hasNext;
    return newPagination;
};
const messageSetPagination = (params) => {
    if (params.parentSet.messages.length < params.returnedPage.length) {
        params.logger?.('error', 'Corrupted message set state: parent set size < returned page size');
        return params.parentSet.pagination;
    }
    if (params.messagePaginationOptions?.created_at_around) {
        return messagePaginationCreatedAtAround(params);
    }
    else if (params.messagePaginationOptions?.id_around) {
        return messagePaginationIdAround(params);
    }
    else {
        return messagePaginationLinear(params);
    }
};
exports.messageSetPagination = messageSetPagination;
/**
 * A utility object used to prevent duplicate invocation of channel.watch() to be triggered when
 * 'notification.message_new' and 'notification.added_to_channel' events arrive at the same time.
 */
const WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL = {};
/**
 * Calls channel.watch() if it was not already recently called. Waits for watch promise to resolve even if it was invoked previously.
 * If the channel is not passed as a property, it will get it either by its channel.cid or by its members list and do the same.
 * @param client
 * @param members
 * @param options
 * @param type
 * @param id
 * @param channel
 */
const getAndWatchChannel = async ({ channel, client, id, members, options, type, }) => {
    if (!channel && !type) {
        throw new Error('Channel or channel type have to be provided to query a channel.');
    }
    // unfortunately typescript is not able to infer that if (!channel && !type) === false, then channel or type has to be truthy
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const channelToWatch = channel || client.channel(type, id, { members });
    // need to keep as with call to channel.watch the id can be changed from undefined to an actual ID generated server-side
    const originalCid = channelToWatch.id
        ? channelToWatch.cid
        : members && members.length
            ? (0, exports.generateChannelTempCid)(channelToWatch.type, members)
            : undefined;
    if (!originalCid) {
        throw new Error('Channel ID or channel members array have to be provided to query a channel.');
    }
    const queryPromise = WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
    if (queryPromise) {
        await queryPromise;
    }
    else {
        try {
            WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid] = channelToWatch.watch(options);
            await WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
        }
        finally {
            delete WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
        }
    }
    return channelToWatch;
};
exports.getAndWatchChannel = getAndWatchChannel;
/**
 * Generates a temporary channel.cid for channels created without ID, as they need to be referenced
 * by an identifier until the back-end generates the final ID. The cid is generated by its member IDs
 * which are sorted and can be recreated the same every time given the same arguments.
 * @param channelType
 * @param members
 */
const generateChannelTempCid = (channelType, members) => {
    if (!members)
        return;
    const membersStr = [...members].sort().join(',');
    if (!membersStr)
        return;
    return `${channelType}:!members-${membersStr}`;
};
exports.generateChannelTempCid = generateChannelTempCid;
/**
 * Checks if a channel is pinned or not. Will return true only if channel.state.membership.pinned_at exists.
 * @param channel
 */
const isChannelPinned = (channel) => {
    if (!channel)
        return false;
    const member = channel.state.membership;
    return !!member?.pinned_at;
};
exports.isChannelPinned = isChannelPinned;
/**
 * Checks if a channel is archived or not. Will return true only if channel.state.membership.archived_at exists.
 * @param channel
 */
const isChannelArchived = (channel) => {
    if (!channel)
        return false;
    const member = channel.state.membership;
    return !!member?.archived_at;
};
exports.isChannelArchived = isChannelArchived;
/**
 * A utility that tells us whether we should consider archived channels or not based
 * on filters. Will return true only if filters.archived exists and is a boolean value.
 * @param filters
 */
const shouldConsiderArchivedChannels = (filters) => {
    if (!filters)
        return false;
    return typeof filters.archived === 'boolean';
};
exports.shouldConsiderArchivedChannels = shouldConsiderArchivedChannels;
/**
 * Extracts the value of the sort parameter at a given index, for a targeted key. Can
 * handle both array and object versions of sort. Will return null if the index/key
 * combination does not exist.
 * @param atIndex - the index at which we'll examine the sort value, if it's an array one
 * @param sort - the sort value - both array and object notations are accepted
 * @param targetKey - the target key which needs to exist for the sort at a certain index
 */
const extractSortValue = ({ atIndex, sort, targetKey, }) => {
    if (!sort)
        return null;
    let option = null;
    if (Array.isArray(sort)) {
        option = sort[atIndex] ?? null;
    }
    else {
        let index = 0;
        for (const key in sort) {
            if (index !== atIndex) {
                index++;
                continue;
            }
            if (key !== targetKey) {
                return null;
            }
            option = sort;
            break;
        }
    }
    return option?.[targetKey] ?? null;
};
exports.extractSortValue = extractSortValue;
/**
 * Returns true only if `{ pinned_at: -1 }` or `{ pinned_at: 1 }` option is first within the `sort` array.
 */
const shouldConsiderPinnedChannels = (sort) => {
    const value = (0, exports.findPinnedAtSortOrder)({ sort });
    if (typeof value !== 'number')
        return false;
    return Math.abs(value) === 1;
};
exports.shouldConsiderPinnedChannels = shouldConsiderPinnedChannels;
/**
 * Checks whether the sort value of type object contains a pinned_at value or if
 * an array sort value type has the first value be an object containing pinned_at.
 * @param sort
 */
const findPinnedAtSortOrder = ({ sort, }) => (0, exports.extractSortValue)({
    atIndex: 0,
    sort,
    targetKey: 'pinned_at',
});
exports.findPinnedAtSortOrder = findPinnedAtSortOrder;
/**
 * Finds the index of the last consecutively pinned channel, starting from the start of the
 * array. Will not consider any pinned channels after the contiguous subsequence at the
 * start of the array.
 * @param channels
 */
const findLastPinnedChannelIndex = ({ channels, }) => {
    let lastPinnedChannelIndex = null;
    for (const channel of channels) {
        if (!(0, exports.isChannelPinned)(channel))
            break;
        if (typeof lastPinnedChannelIndex === 'number') {
            lastPinnedChannelIndex++;
        }
        else {
            lastPinnedChannelIndex = 0;
        }
    }
    return lastPinnedChannelIndex;
};
exports.findLastPinnedChannelIndex = findLastPinnedChannelIndex;
/**
 * A utility used to move a channel towards the beginning of a list of channels (promote it to a higher position). It
 * considers pinned channels in the process if needed and makes sure to only update the list reference if the list
 * should actually change. It will try to move the channel as high as it can within the list.
 * @param channels - the list of channels we want to modify
 * @param channelToMove - the channel we want to promote
 * @param channelToMoveIndexWithinChannels - optionally, the index of the channel we want to move if we know it (will skip a manual check)
 * @param sort - the sort value used to check for pinned channels
 */
const promoteChannel = ({ channels, channelToMove, channelToMoveIndexWithinChannels, sort, }) => {
    // get index of channel to move up
    const targetChannelIndex = channelToMoveIndexWithinChannels ?? channels.findIndex((channel) => channel.cid === channelToMove.cid);
    const targetChannelExistsWithinList = targetChannelIndex >= 0;
    const targetChannelAlreadyAtTheTop = targetChannelIndex === 0;
    // pinned channels should not move within the list based on recent activity, channels which
    // receive messages and are not pinned should move upwards but only under the last pinned channel
    // in the list
    const considerPinnedChannels = (0, exports.shouldConsiderPinnedChannels)(sort);
    const isTargetChannelPinned = (0, exports.isChannelPinned)(channelToMove);
    if (targetChannelAlreadyAtTheTop || (considerPinnedChannels && isTargetChannelPinned)) {
        return channels;
    }
    const newChannels = [...channels];
    // target channel index is known, remove it from the list
    if (targetChannelExistsWithinList) {
        newChannels.splice(targetChannelIndex, 1);
    }
    // as position of pinned channels has to stay unchanged, we need to
    // find last pinned channel in the list to move the target channel after
    let lastPinnedChannelIndex = null;
    if (considerPinnedChannels) {
        lastPinnedChannelIndex = (0, exports.findLastPinnedChannelIndex)({ channels: newChannels });
    }
    // re-insert it at the new place (to specific index if pinned channels are considered)
    newChannels.splice(typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0, 0, channelToMove);
    return newChannels;
};
exports.promoteChannel = promoteChannel;
