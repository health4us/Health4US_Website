/*
EventId copied from https://github.com/google/eventid-js
d64 encode copied from https://www.npmjs.com/package/d64
Both these libraries use Uint8Array which is not supported in SSR
because v8 snapshots (that SSR uses) do not support typed arrays
*/

const uuidV4 = require('uuid/v4');

const chars = '.PYFGCRLAOEUIDHTNSQJKXBMWVZ_pyfgcrlaoeuidhtnsqjkxbmwvz1234567890'
    .split('')
    .sort()
    .join('');

function EventId() {
    this.b = new Array(24);
    this.b.fill(0);
    uuidV4(null, this.b, 8);
}

function d64Encode(data) {
    let s = '';
    const l = data.length;
    let hang = 0;

    for (let i = 0; i < l; i++) {
        const v = data[i];

        switch (i % 3) {
            case 0:
                s += chars[v >> 2];
                hang = (v & 3) << 4;
                break;
            case 1:
                s += chars[hang | (v >> 4)];
                hang = (v & 0xf) << 2;
                break;
            case 2:
                s += chars[hang | (v >> 6)];
                s += chars[v & 0x3f];
                hang = 0;
                break;
            default:
        }
    }
    if (l % 3) {
        s += chars[hang];
    }
    return s;
}

EventId.prototype.new = function() {
    for (let i = 7; i >= 0; i--) {
        if (this.b[i] !== 255) {
            this.b[i]++;
            break;
        }
        this.b[i] = 0;
    }
    return d64Encode(this.b);
};

module.exports = EventId;