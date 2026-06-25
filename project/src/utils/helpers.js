import { VIOLATION_STATUS } from "./constant.js";

export const getViolationStatusClass = (status) => {
    switch (status) {
        case VIOLATION_STATUS.CAPTURED:
            return 'status-captured';

        case VIOLATION_STATUS.NOTIFIED:
            return 'status-notified';

        case VIOLATION_STATUS.PAID:
            return 'status-paid';

        case VIOLATION_STATUS.RELEASED:
            return 'status-released';

        default:
            return '';
    }
};