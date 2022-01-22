import * as constants from "./utils/constants";

export class Emulator {
    private _memory: Uint8Array;
    private _vreg: Uint8Array;
    private _ireg: number;
    private _stack: Uint16Array;
    
    private _pc: number;

    private _dt: number;
    private _st: number;

    private _keys: Array<boolean>;
    
    private _screen: Array<boolean>;
    
    constructor() {
        this._memory = new Uint8Array(constants.ram_size);
        this._stack = new Uint16Array(constants.stack_size);
        
        this._vreg = new Uint8Array(constants.reg_size);
        this._ireg = 0;
        
        this._pc = 0x200;

        this._dt = 0;
        this._st = 0;

        this._keys = new Array<boolean>(constants.key_size);
        
        this._screen = new Array<boolean>(constants.screen_width * constants.screen_height);
    }
}
