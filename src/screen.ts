import * as constants from "./utils/constants";
import * as blessed from "blessed";

export class Screen {
    private _screen: Array<Array<number>>;
    private _terminal: blessed.Widgets.Screen;

    constructor() {
        this._screen = new Array<Array<number>>();
        this._init_screen();

        this._terminal = blessed.screen({smartCSR: true});
    }

    public drawPixel(x: number, y: number): boolean {
        this._screen[x][y] ^= 1;

        if(this._screen[x][y]) {
            this._terminal.fillRegion('#ffffff', 'X', x, x + 1, y, y + 1);
        }
        else {
            this._terminal.clearRegion(x, x + 1, y, y + 1);
        }

        this._terminal.render();
        return !this._screen[x][y];
    }

    public render(): void {
        for(let i: number = 0; i < this._screen.length; i++) {
            for(let j: number = 0; j < this._screen[i].length; j++) {
                console.log(this._screen[i][j]);
            }
        }
    }
    
    private _init_screen(): void {
        for (let i: number = 0; i < 32; i++) {
            this._screen.push([]);
            for (let j: number = 0; j < 64; j++) {
                this._screen[i].push(0);
            }
        }
    }
}
