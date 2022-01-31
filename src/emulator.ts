import * as constants from "./utils/constants";
import { Screen } from "./screen";

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
    
    private _screen: Screen; 
    
    constructor() {
        this._memory = new Uint8Array(constants.ram_size);
        this._stack = new Uint16Array(constants.stack_size);
        
        this._vreg = new Uint8Array(constants.reg_size);
        this._ireg = 0;

        this._sp = 0;
        this._pc = 0x200;

        this._dt = 0;
        this._st = 0;

        this._keys = new Array<boolean>(constants.key_size);

        this._screen = new Screen();
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
        //this._screen.render();

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

        this._sp = 0;
        this._pc = 0x200;

        this._dt = 0;
        this._st = 0;

        this._keys = new Array<boolean>(constants.key_size);
        
        this._screen = new Screen();

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

        // combine the two values
        //console.log("instruction: " + ((first_byte << 8) | second_byte).toString(16));
        return (first_byte << 8) | second_byte;
    }

    // Decode the opcode and do pattern matching
    private _execute(opcode: number): void {

        /*
          vx is the second nibble of the first instruction.
          vy is the third nibble of the second instruction.

          For example, if we have a instruction consisting of 0x8451, we use bitwise AND
          to get rid of everything we don't need and then shift right to get the result
          we want.

          vx is in this example 0x4
          vy is in this example 0x5

          (opcode & 0x0F00) = 0x0400
          (opcode & 0x00F0) = 0x0050
          
          0x0400 >> 8 = 0x04 or 0x4
          0x0050 >> 4 = 0x05 or 0x5

          These are used to look up values in the register.
         */
        const x: number = (opcode & 0x0F00) >> 8;
        const y: number = (opcode & 0x00F0) >> 4;
        // Mask of the the first number in the instruction
        // This first number indicates what kind of instruction it is.
        switch(opcode & 0xF000) {
            case 0x0000:
                switch(opcode & 0x000F) {
                    case 0x00E0: // clear the screen
                        this._screen = new Screen();
                        break;
                    case 0x00EE: // return from subroutine
                        this._pc = this._stack[this._pc];
                        console.log("subroutine return");
                        this._sp--;
                        break;
                }
            case 0x1000: // 1NNN: jump NNN
                this._pc = (opcode & 0x0FFF);
                break;
            case 0x2000: // 2NNN: Call addr
                this._push(this._pc);
                this._pc = (opcode & 0x0FFF);
                break;
            case 0x3000: // 3XNN: if _vreg[x] != NN
                if(this._vreg[x] === (opcode & 0x00FF))
                    this._pc += 2;
                break;
            case 0x4000: // 4XNN: if _vreg[x] == NN
                if(this._vreg[x] !== (opcode & 0x00FF))
                    this._pc += 2;
                break;
            case 0x5000: // 5XY0: if _vreg[x] != _vreg[y]
                if(this._vreg[x] === this._vreg[y])
                    this._pc += 2;
                break;
            case 0x6000: // 6XNN: _vreg[x] = NN
                this._vreg[x] = (opcode & 0x00FF);
                break;
            case 0x7000: // 7XNN: _vreg[x] += NN
                this._vreg[x] += (opcode & 0x00FF);
                break;
            case 0x8000: // 8XY0 - 8XYE
                switch(opcode & 0x000F) {
                    case 0x8000:
                        this._vreg[x] = this._vreg[y];
                        break;
                    case 0x8001:
                        this._vreg[x] |= this._vreg[y];
                        break;
                    case 0x8002:
                        this._vreg[x] &= this._vreg[y];
                        break;
                    case 0x8003:
                        this._vreg[x] ^= this._vreg[y];
                        break;
                    case 0x8004:

                        let sum: number = (this._vreg[x] += this._vreg[y]);
                        this._vreg[0x000F] = 0;

                        if(sum > 255)
                            this._vreg[0x000F] = 1;

                        this._vreg[x] = sum;
                       
                        break;
                    case 0x8005:
                        this._memory[0x000F] = 0;
                        if(this._vreg[x] > this._vreg[y])
                            this._memory[0x000F] = 1;
                        
                        this._vreg[x] -= this._vreg[y];
                        break;
                    case 0x8006:
                        this._vreg[0x000F] = (this._vreg[x] & 0x1);

                        this._vreg[x] >>= 1;
                        break;
                    case 0x8007:
                        this._memory[0x000F] = 0;
                        if(this._vreg[x] < this._vreg[y])
                            this._memory[0x000F] = 1;

                        this._vreg[x] = this._vreg[y] - this._vreg[x];
                        break;
                    case 0x800E:
                        this._vreg[0x000F] = (this._vreg[x] & 0x80);
                        this._vreg[x] <<= 1;
                        break;
                }
                break;
            case 0x9000: // 9XY0: if _vreg[x] == _vreg[y]
                if(this._vreg[x] !== this._vreg[y])
                    this._pc += 2;
                break;
            case 0xA000: // ANNN: _ireg = NNN
                this._ireg = (opcode & 0x0FFF);
                break;
            case 0xB000: // BNNN: jump to NNN + _vreg[0]
                this._pc = (opcode & 0x0FFF) + this._vreg[0];
                break;
            case 0xC000: // CXNN: _vreg[x] = rand & least significant byte
                this._vreg[x] = (Math.random() * 255) & (opcode & 0x00FF);
                break;
            case 0xD000: // DXYN: draw and erase pixels
                let x_coord: number = this._vreg[x];
                let y_coord: number = this._vreg[y];
                let height: number = (opcode & 0x000F);
                this._vreg[0x000F] = 0;
                
                for(let i: number = 0; i < height; i++) {
                    let sprite: number = this._memory[this._ireg + i];

                    for(let j: number = 0; j < 8; j++) {
                        if((sprite & 0x80) != 0) {
                            let xx: number = (x_coord + j) % constants.screen_width;
                            let yy: number = (y_coord + i) % constants.screen_height;

                            if(this._screen.drawPixel(xx, yy))
                                this._vreg[0x000F] = 1;
                        }

                        sprite <<= 1;
                    }
                }
                
                break;
            case 0xE000: // EX9E: if _vreg[x] not key pressed
                // EXA1: if _vreg[x] key pressed
                break;
            case 0xF000: // FX07 - FX65
                switch(opcode & 0x00FF) {
                    case 0xF007:
                        this._vreg[x] = this._dt;
                        break;
                    case 0xF015:
                        this._dt = this._vreg[x];
                        break;
                    case 0xF018:
                        this._st = this._vreg[x];
                        break;
                    case 0xF01E:
                        this._ireg += this._vreg[x];
                        break;
                    case 0xF00A:
                        //TODO 
                        break;
                    case 0xF029:
                        this._ireg = this._vreg[x] * 5;
                        break;
                    case 0xF033:
                        this._memory[this._ireg] = this._vreg[x] / 100;

                        this._memory[this._ireg + 1] = (this._vreg[x] % 100) / 10;

                        this._memory[this._ireg + 2] = this._vreg[x] % 10;
                        break;
                    case 0xF055:
                        for(let i: number = 0; i <= x; i++)
                            this._memory[this._ireg + i] = this._vreg[i];
                        break;
                    case 0xF065:
                        for(let i: number = 0; i <= x; i++)
                            this._vreg[i] = this._memory[this._ireg + i];
                        break;
                }
                break;
            default:
                console.log("doesnt match");
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
