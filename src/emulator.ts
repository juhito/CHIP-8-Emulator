import * as constants from "./utils/constants";

export class Emulator {
    /*
      RAM: 
      
      CHIP-8 is designed to copy the entire game program into its own RAM space, where it can then read and written
      to as needed. It was originally sesigned to be implemented on computers with 4096 bytes (4 KB) of RAM, so
      that's how much it is allocated with.

      V and I Registers:
      
      RAM access is usually considered fairly slow (yet still much faster than reading from disc). To speed things 
      up, the CHIP-8 defines sixteen 8-bit registers which the game can use as it pleases for much faster operations.
      These are referred to as the V registers, and are usually numbered in hex from V0 to VF.

      There is also another 16-bit register known as the I Register, which is used for indexing into RAM for reads and writes.

      Stack:

      The CPU also has a small stack, which is an array of 16-bit values that the CPU can read and write to. The stack differs
      from regular RAM as the stack can only be read/written to via a FIFO principle. However, the stack is not general purpose.
      Only times the stack is allowed to be used is when you are entring or exiting a subroutine, where the stack is used to know
      where you started so you can return after the routine ends. 
     */
    private _memory: Uint8Array;
    private _vreg: Uint8Array;
    private _ireg: number;
    private _stack: Uint16Array;

    private _sp: number; // Stack pointer 
    private _pc: number; // Index of the current instruction, known as the "Program Counter".

    /* 
       These are two special registers that are used as timers. Delay timer is used by the system as a typical timer,
       counting down every cycle and performing some action if it hits 0. The Sound timer on the other hand, also counts
       down every clock cycle, but upon hitting 0 emits a noise. Both are 8-bit registers.
     */
    private _dt: number;
    private _st: number;

    private _keys: Array<boolean>;
    
    private _screen: Array<boolean>; 
    
    constructor() {
        this._memory = new Uint8Array(constants.ram_size);
        this._stack = new Uint16Array(constants.stack_size);
        
        this._vreg = new Uint8Array(constants.reg_size);
        this._ireg = 0;

        this._sp = -1;
        this._pc = 0x200;

        this._dt = 0;
        this._st = 0;

        this._keys = new Array<boolean>(constants.key_size);
        
        this._screen = new Array<boolean>(constants.screen_width * constants.screen_height);

        // Populates the font data in the first 80 bytes of memory.
        for(let i: number = 0; i < constants.font_size; i++) {
            this._memory[i] = constants.font_set[i];
        }
    }

    // represents each clock cycle.
    public tick(): void {
        /*
          1. Fetch the instruction from RAM @ the address pointed by the PC.
          2. Decode the instruction.
          3. Execute the instruction.
          4. Increment PC and repeat.
        */

        const op: number = this._fetch();
        this._execute(op);

        // update timers
        if(this._dt > 0) this._dt -= 1;
        if(this._st > 0) {
            if(this._st == 1) console.log("make beep sound :)");
            this._st -= 1;
        }
    }

    public load(data: Uint8Array): void {
        for(let i: number = 0; i < data.length; i++) {
            this._memory[this._pc + i] = data[i];
        }
    }
    
    // add a way to reset without making a new object
    public reset(): void {
        this._memory = new Uint8Array(constants.ram_size);
        this._stack = new Uint16Array(constants.stack_size);
        
        this._vreg = new Uint8Array(constants.reg_size);
        this._ireg = 0;

        this._sp = -1;
        this._pc = 0x200;

        this._dt = 0;
        this._st = 0;

        this._keys = new Array<boolean>(constants.key_size);
        
        this._screen = new Array<boolean>(constants.screen_width * constants.screen_height);

        // Populates the font data in the first 80 bytes of memory.
        for(let i: number = 0; i < constants.font_size; i++) {
            this._memory[i] = constants.font_set[i];
        }
    }

    // Fetch the instruction (known as an opcode) from RAM 
    private _fetch(): number {
        const first_byte: number = this._memory[this._pc];
        const second_byte: number = this._memory[this._pc + 1];

        this._pc += 2; // move forward 2 bytes

        // combine the two values as Big Endian.
        return (first_byte << 8) | second_byte;
    }

    // Decode the opcode and do pattern matching
    private _execute(opcode: number): void {
        // Mask of the the first number in the instruction
        // This first number indicates what kind of instruction it is.
        switch(opcode & 0xF000) {
            case 0x0000:
                switch(opcode & 0x000F) {
                    case 0x00E0:
                        break;
                    case 0x00EE:
                        break;
                }
            case 0x1000: // 1NNN: jump NNN
                break;
            case 0x2000: // 2NNN: Call addr
                break;
            case 0x3000: // 3XNN: if vx != NN 
                break;
            case 0x4000: // 4XNN: if vx == NN
                break;
            case 0x5000: // 5XYO: if vx != vy 
                break;
            case 0x6000: // 6XNN: vx = NN
                break;
            case 0x7000: // 7XNN: vx += NN
                break;
            case 0x8000: // 8XYO - 8XYE
                // includes way more instructions
                // compare the last byte
                break;
            case 0x9000: // 9XYO: if vx == vy
                break;
            case 0xA000: // ANNN: pc = NNN
                break;
            case 0xB000: // BNNN: jump to NNN + _vreg[0]
                break;
            case 0xC000: // CXNN: _vreg[vx] = rand & least significant byte
                break;
            case 0xD000: // DXYN: draw and erase pixels
                break;
            case 0xE000: // EX9E: if vx not key pressed
                // EXA1: if vx key pressed
                break;
            case 0xF000: // FX07 - FX65
                // includes more instructions
                // compare the two last bytes
                break;
            default:
                break;
        }
    }

    // Adds the given value to the spot pointed by the SP, then moves the pointer to the next position.
    private _push(data: number): void {
        this._stack[this._sp] = data;
        this._sp += 1;
    }
    
    // Moves the SP back to the previous position and then returns its value.
    private _pop(): number {
        this._sp -= 1;
        return this._stack[this._sp];
    }
}
