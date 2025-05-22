"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotingVisibility = exports.ErrorFromResponse = void 0;
class ErrorFromResponse extends Error {
}
exports.ErrorFromResponse = ErrorFromResponse;
var VotingVisibility;
(function (VotingVisibility) {
    VotingVisibility["anonymous"] = "anonymous";
    VotingVisibility["public"] = "public";
})(VotingVisibility || (exports.VotingVisibility = VotingVisibility = {}));
