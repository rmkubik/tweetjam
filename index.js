const cartdat = require('./_cartdat');
const fs = require('fs');

// http://pico-8.wikia.com/wiki/P8PNGFileFormat
// https://www.lexaloffle.com/bbs/?tid=2400

const isCompressed = data => {
    return (String.fromCharCode(data[0]) === ':'
        & String.fromCharCode(data[1]) === 'c'
        & String.fromCharCode(data[2]) === ':'
        & String.fromCharCode(data[3]) === '\u0000') === 1;
};

const codeLength = data => {
    const msB = data[4] << 8;
    return msB + data[5];
};

const getCodeLength = code => {
    const length = code.length;
    const msB = (length & 0x0000ff00) >> 8;
    const lsB = (length & 0x000000ff);

    return [msB, lsB];
};

const table = '\n 0123456789abcdefghijklmnopqrstuvwxyz!#%(){}[]<>+=/*:;.,~_';
const lookup = id => table[id];
const lookupIndex = char => table.indexOf(char);

const decodeCompression = bytes => {
    let output = [];
    
    // TODO: Need to short circuit looping once output hits correct length

    let printByte = false;
    let prevByte = null;
    // skip first 7 bytes as they are not code bytes
    bytes.slice(8).forEach(byte => {
        if (printByte) {
            if (byte > 127) {
                console.log(`NON ASCII BYTE: ${byte}`);
                output.push('□');
            } else {
                output.push(String.fromCharCode(byte));
            }
            printByte = false;
        } else if(prevByte !== null) {
            const offset = (prevByte - 0x3c) * 16 + (byte & 0xf);
            const length = (byte >> 4) + 2;
            const startIndex = output.length - offset;

            output.push(...output.slice(startIndex, startIndex + length));
            prevByte = null;
        } else {
            if (byte === 0x00) {
                // 0x00 --> print next char
                printByte = true;
            } else if (byte >= 0x01 && byte <= 0x3b) {
                // 0x01-0x3b --> lookup table
                output.push(lookup(byte - 1));
            } else if (byte >= 0x3c && byte <= 0xff) {
                // 0x3c-0xff --> set prev byte to calculate offset
                prevByte = byte;
            } else {
                console.log('WOW THATS A BIG BYTE');
            }
        }
    });
    return output.slice(0, codeLength(bytes));
};

const encodeCompression = code => {
    let output = [];

    // TODO: check if code needs to be compressed or not

    // code.forEach(char => {
    //     output.push(char.charCodeAt(0));
    // });

    code.split('').forEach(char => {
        let byte = lookupIndex(char) + 1;
        if (byte === 0) {
            output.push(0x00);
            byte = char.charCodeAt(0);
        }
        output.push(byte);
    });

    output.unshift(
        ':'.charCodeAt(0), // compressed signature (4 bytes)
        'c'.charCodeAt(0),
        ':'.charCodeAt(0),
        0x00, 
        ...getCodeLength(output), // compressed code length (2 bytes)
        0x00, // null bytes (2 bytes)
        0x00
    ); 

    return output;
};

const stripCartHeader = cart => {
    let pointer;
    let newlineCount = 0;
    for(pointer = 0; pointer < cart.length && newlineCount < 3; pointer++) {
        if (cart[pointer] === '\n') {
            newlineCount++;
        }
    }
    return cart.slice(pointer);
};

const cartHeader = 'pico-8 cartridge // http://www.pico-8.com\nversion 16\n__lua__\n';

const encodeCartData = (codeFile, cartDataFile) => {
    fs.readFile(codeFile, (err, data) => {
        const cart = stripCartHeader(data.toString());
    
        fs.writeFile(
            cartDataFile, 
            encodeCompression(cart), 
            (err) => {}
        );
    });
};

const decodeCartDataCsv = (cartDataFile, codeFile) => {
    fs.readFile(cartDataFile, (err, data) => {
        const bytes = data
            .toString()
            .split(',')
            .map(str => parseInt(str));

        fs.writeFile(
            codeFile, 
            cartHeader + decodeCompression(bytes).join(''), 
            (err) => {}
        );
    });
};

// TODO: Actually confirm max length... Seems to be varying reports
const extractCodeBytesFromCartBytes = bytes => bytes.slice(0x4300, 0x8000); // this is the length of the code section
const extractRamInitializerBytes = bytes => bytes.slice(0, 0x4300);

extractRamInitializerBytes(cartdat.data);

// encodeCartData('./tweetjam_out.p8', './cartdata2.csv');
// decodeCartDataCsv('./cartdata2.csv', './tweetjam_out2.p8');