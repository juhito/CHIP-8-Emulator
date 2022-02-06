import * as constants from "./utils/constants";
import * as blessed from "blessed";

export class Screen {
    private screen: Array<Array<number>>;
    private terminal: blessed.Widgets.Screen;

    constructor() {
        this.screen = new Array<Array<number>>();
        this.init_screen();

        this.terminal = blessed.screen({smartCSR: true});
    }

    public drawPixel(x: number, y: number): boolean {
        this.screen[y][x] ^= 1;

        if(this.screen[y][x]) {
            this.terminal.fillRegion('', '<', x, x + 1, y, y + 1);
        }
        else {
            this.terminal.clearRegion(x, x + 1, y, y + 1);
        }

        this.terminal.render();
        return !this.screen[y][x];
    }
    
    private init_screen(): void {
        for (let i: number = 0; i < 32; i++) {
            this.screen.push([]);
            for (let j: number = 0; j < 64; j++) {
                this.screen[i].push(0);
            }
        }
    }
}
