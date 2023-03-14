import type {
    AddBall,
    BoardSize, ColorAndPosition, CostedPosition,
    FailedPathResult,
    MovePath,
    Position,
    RemoveBall, Statistics,
    SuccessfulPathResult, TravelCostEstimate
} from "./client-board";

enum Direction {
    NORTH,
    SOUTH,
    WEST,
    EAST,
    NORTH_WEST,
    SOUTH_WEST,
    SOUTH_EAST,
    NORTH_EAST,
}

const MovementDirections: Direction[] = [Direction.NORTH, Direction.SOUTH, Direction.WEST, Direction.EAST];
const Directions: Direction[] = [Direction.NORTH, Direction.SOUTH, Direction.WEST, Direction.EAST, Direction.NORTH_WEST, Direction.SOUTH_WEST, Direction.SOUTH_EAST, Direction.NORTH_EAST];

export interface ServerBoard {
    score: number;
    emptyTileCount: number;

    onPathFindReceipt(hovPos: MovePath): FailedPathResult | SuccessfulPathResult;

    onStartMessageReceipt(): (AddBall | RemoveBall)[];

    onMoveMessageReceipt(move: MovePath): (AddBall | RemoveBall)[];
}

export class ServerBoardCreator {
    static create(size: BoardSize): ServerBoard {
        return new Board(size);
    }
}

class Board implements ServerBoard {
    private currentScore = 0;
    private nextBallColors: number[] = [];
    private numberOfColors = 6;
    private _board: (number | undefined)[][] = [];
    private readonly _size: BoardSize;
    private aStarFinder = new AStarFinder();

    constructor(size: BoardSize) {
        this._size = size;
        for (let i = 0; i < size.depth; i++) {
            //init rows for kicks.
            this._board[i] = [];
        }
    }

    get score(): number {
        return this.currentScore
    }

    get emptyTileCount(): number {
        let count = this.size.depth * this.size.width;
        for (let row_count = 0; row_count < this.size.depth; row_count++) {
            const row = this._board[row_count];
            if (row) {
                for (let tile_count = 0; tile_count < this.size.width; tile_count++) {
                    const color = row[tile_count];
                    if (color) {
                        count--;
                    }
                }
            }
        }
        return count;
    }

    get size(): BoardSize {
        return this._size;
    }

    onStartMessageReceipt(): (AddBall | RemoveBall)[] {
        this.randomNext3Colors();
        return this.addNext3Balls();
    }

    onPathFindReceipt(hovPos: MovePath): (SuccessfulPathResult | FailedPathResult) {
        return this.aStarFinder.findPath(this, hovPos.from, hovPos.to)
    }

    onMoveMessageReceipt(move: MovePath): (AddBall | RemoveBall)[] {
        const success = this.move(move.from, move.to);
        let changes: (AddBall | RemoveBall)[] = [];
        const color = this.getColor(move.to);
        if (success && color) {
            changes.push({ x: move.from.x, y: move.from.y, command: 'REMOVE' });
            changes.push({ x: move.to.x, y: move.to.y, color: color, command: 'ADD' });
            const removals = this.getMatchRemovalsAndUpdateScore(move.to);
            if (removals.length > 0) {
                //move made a match
                changes = changes.concat(removals);
            } else {
                //add three more balls if we weren't able to match five with this move.
                this.addNext3Balls().forEach(ballPosition => {
                    changes.push(ballPosition);
                    //new balls can create matches as well so check each one.
                    changes = changes.concat(this.getMatchRemovalsAndUpdateScore(ballPosition));
                });
            }
        }
        return changes;
    }

    isColorSetAtPosition(position: Position): boolean {
        return (!!this.getColor(position));
    }

    addNext3Balls(): (AddBall | RemoveBall)[] {
        const added: AddBall[] = [];
        for (let i = 0; i < 3;) {
            if (this.isFull()) {
                return []; // loss
            }
            const posX = this.randomInt(0, this.size.width - 1);
            const posY = this.randomInt(0, this.size.depth - 1);
            const position: Position = { x: posX, y: posY };
            if (!this.isColorSetAtPosition(position)) {
                const color: (number | undefined) = this.nextBallColors.at(i);
                if (!color) {
                    throw new Error(`unexpected next ball color is undefined.`)
                }
                const colorAndPos: AddBall = { x: posX, y: posY, color: color, command: 'ADD' };
                this.setColor(colorAndPos);
                added.push(colorAndPos);
                i++;
            }
        }
        this.randomNext3Colors();
        return added;
    }

    randomNext3Colors(): void {
        this.nextBallColors = [
            this.randomInt(1, this.numberOfColors),
            this.randomInt(1, this.numberOfColors),
            this.randomInt(1, this.numberOfColors),
        ];
    }

    isPositionOnTheBoard(position: Position): boolean {
        return ((position.x >= 0 && position.y >= 0) && (position.x < this.size.width && position.y < this.size.depth));
    }

    getNeighbor(position: Position, direction: Direction): Position | undefined {
        let neighbor: Position;
        switch (direction) {
            case Direction.NORTH:
                neighbor = { x: position.x, y: position.y - 1 };
                break;
            case Direction.SOUTH:
                neighbor = { x: position.x, y: position.y + 1 };
                break;
            case Direction.WEST:
                neighbor = { x: position.x - 1, y: position.y };
                break;
            case Direction.EAST:
                neighbor = { x: position.x + 1, y: position.y };
                break;
            case Direction.NORTH_WEST:
                neighbor = { x: position.x - 1, y: position.y - 1 };
                break;
            case Direction.SOUTH_WEST:
                neighbor = { x: position.x - 1, y: position.y + 1 };
                break;
            case Direction.SOUTH_EAST:
                neighbor = { x: position.x + 1, y: position.y + 1 };
                break;
            case Direction.NORTH_EAST:
                neighbor = { x: position.x + 1, y: position.y - 1 };
                break;
            default:
                throw new Error('unexpected value in direction switch');
        }
        if (this.isPositionOnTheBoard(neighbor)) {
            return neighbor;
        }
        return undefined;
    }

    getFreeNeighbors(position: Position): Position[] {
        const freeNeighbors: Position[] = []
        Directions.forEach(direction => {
            const neighbor = this.getNeighbor(position, direction);
            if (neighbor && !this.isColorSetAtPosition(neighbor)) {
                freeNeighbors.push(neighbor);
            }
        });
        return freeNeighbors;
    }

    getFreeMovementNeighbors(position: Position): Position[] {
        const freeNeighbors: Position[] = []
        MovementDirections.forEach(direction => {
            const neighbor = this.getNeighbor(position, direction);
            if (neighbor && !this.isColorSetAtPosition(neighbor)) {
                freeNeighbors.push(neighbor);
            }
        });
        return freeNeighbors;
    }

    private setColor(colorPos: ColorAndPosition) {
        let row = this._board[colorPos.y]
        if (!row) {
            row = [];
            this._board[colorPos.y] = row;
        }
        row[colorPos.x] = colorPos.color;
    }

    private getColor(position: Position): number | undefined {
        const row = this._board[position.y];
        if (row) {
            return row[position.x];
        }
        return undefined;
    }

    private isFull(): boolean {
        for (let row = 0; row < this._size.depth; row++) {
            for (let tile = 0; tile < this._size.width; tile++) {
                if (!this.isColorSetAtPosition({ x: tile, y: row })) {
                    return false
                }
            }
        }
        return true;
    }

    private release(x: number, y: number): boolean {
        const row = this._board[y]
        if (row) {
            const color = row[x]
            if (color) {
                row[x] = undefined;
                return true;
            }
        }
        console.error(`release failure ${x},${y}`)
        return false;
    }

    private move(from: Position, to: Position): boolean {
        const color = this.getColor(from);
        if (color) {
            this.release(from.x, from.y);
            this.setColor({ x: to.x, y: to.y, color: color });
            return true;
        }
        return false;
    }

    private getMatchRemovalsAndUpdateScore(position: Position) {
        const ballsToRemove: Position[] = this.checkFor5(position)
        const changes: RemoveBall[] = [];
        ballsToRemove.forEach((ball) => {
            this.release(ball.x, ball.y)
            changes.push({ x: ball.x, y: ball.y, command: "REMOVE" });
        });
        this.setGameScore(this.currentScore + changes.length * changes.length);
        return changes;
    }

    private checkFor5(ballPosition: Position): Position[] {
        const color = this.getColor(ballPosition);
        if (!color) {
            throw new Error("can't find color for ball position");
        }
        let positions: Position[] = this.checkBiDirectional(ballPosition, color, Direction.NORTH, Direction.SOUTH);
        positions = positions.concat(this.checkBiDirectional(ballPosition, color, Direction.WEST, Direction.EAST));
        positions = positions.concat(this.checkBiDirectional(ballPosition, color, Direction.NORTH_WEST, Direction.SOUTH_EAST));
        positions = positions.concat(this.checkBiDirectional(ballPosition, color, Direction.NORTH_EAST, Direction.SOUTH_WEST));
        if (positions.length > 0) {
            positions.push(ballPosition);
        }
        return positions;
    }

    /** calls forward and backward and combines the results */
    private checkBiDirectional(ballPosition: Position, color: number, direction: Direction, opposingDirection: Direction): Position[] {
        const line = this.checkOneDirection(ballPosition, color, direction).concat(this.checkOneDirection(ballPosition, color, opposingDirection));
        /* ball position will get added to the line at the end so a length of 4 plus ball position should trigger a match */
        if (line.length >= 4) {
            return line;
        }
        return [];
    }

    /** recursive method to search one direction for same colored balls */
    private checkOneDirection(position: Position, color: number, direction: Direction): Position[] {
        let line: Position[] = []
        if (!(this.isPositionOnTheBoard(position) && this.getColor(position) == color)) {
            //we are off the board or the wrong color
            return line;
        }
        const neighbor = this.getNeighborOfColor(position, direction, color);
        if (neighbor) {
            line.push(neighbor);
            line = line.concat(this.checkOneDirection(neighbor, color, direction));
        }
        return line;
    }

    private getNeighborOfColor(position: Position, direction: Direction, color: number): Position | undefined {
        const neighbor = this.getNeighbor(position, direction);
        if (neighbor && (this.getColor(neighbor) == color)) {
            return neighbor;
        }
        return undefined;
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private setGameScore(score: number): void {
        this.currentScore = score;
    }
}

class AStarFinder {
    computeFinalPath(currentPos: CostedPosition, from: Position, closedList: CostedPosition[]): CostedPosition[] {
        const finalPath = [currentPos];
        while (!(this.isSamePosition(currentPos, from))) {
            const adjacentTiles = this.getAdjacentFromClosedList(closedList, currentPos);
            adjacentTiles.some((tile) => {
                if (currentPos.travelCost - 1 == tile.travelCost) {
                    finalPath.push(tile);
                    currentPos = tile;
                    return true;
                }
                return false;
            });
        }
        return finalPath;
    }

    /** This method modifies the openList array passed in. */
    getBestTile(openList: CostedPosition[]): CostedPosition {
        const best = openList.sort((a, b) => {
            return this.getTileScore(a) - this.getTileScore(b);
        }).shift();
        if (!best) {
            throw new Error(`unexpected undefined return from open list`);
        }
        return best;
    }

    isSamePosition(positionA: Position | undefined, positionB: Position | undefined): boolean {
        return !!(positionA && positionB && positionA.x == positionB.x && positionA.y == positionB.y);
    }

    findPath(board: Board, from: Position, targetPos: Position): (SuccessfulPathResult | FailedPathResult) {
        if (this.isSamePosition(from, targetPos)) {
            //can't navigate from tile to same tile
            return { success: false, openList: [], closedList: [], from: from, to: targetPos } as FailedPathResult;
        }
        let openList: CostedPosition[] = [];
        let currentPos: CostedPosition = { x: from.x, y: from.y, travelCost: 0, estimate: 0 };
        const closedList: CostedPosition[] = [currentPos];
        // add adjacent tiles to open list:
        openList = openList.concat(this.getFreeAdjacentTiles(currentPos, board, 0, targetPos));
        while (openList.length !== 0) {
            // 1. if openList is empty -> no more field to check -> no path
            // 2. get the best tile from open list
            // 3. change position to the best tile and move it from openList to closedList
            currentPos = this.getBestTile(openList);
            closedList.push(currentPos);
            // 4. if currentPos == targetPos compute final path:
            if (this.isSamePosition(currentPos, targetPos)) {
                // compute and return final path:
                const finalPath: CostedPosition[] = this.computeFinalPath(currentPos, from, closedList);
                return {
                    success: true,
                    openList: openList,
                    closedList: closedList,
                    finalPath: finalPath,
                    to: targetPos,
                    from: from
                } as SuccessfulPathResult;
            }
            // 5. get adjacent tiles
            const adjacentTiles = this.getFreeAdjacentTiles(currentPos, board, currentPos.travelCost, targetPos);
            // 6. forEach adjTile do action depending on in which list is the tile
            adjacentTiles.forEach((adjTile) => {
                // 6.1. if tile is in the closed list, ignore it
                if (this.checkIfPointInList(adjTile, closedList)) {
                    // do nothing
                    return;
                }
                // 6.2. if tile is not in the open list: add it to open list.
                else if (!this.checkIfPointInList(adjTile, openList)) {
                    this.addUniquePointToArray(adjTile, openList);
                }
                // 6.3. if title is in the open list:
                else {
                    // Check if the travelCost is lower when we use the current generated path to get there.
                    // If it is, update its score and update its parent as well.
                    if (adjTile.travelCost > currentPos.travelCost + 1) {
                        adjTile.travelCost = currentPos.travelCost + 1;
                    }
                }
            });
        }
        return { success: false, openList, closedList } as FailedPathResult;
    }

    // Manhattan heuristic:
    private getEstimate(from: Position, to: Position) {
        return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    }

    private getTileScore(tile: TravelCostEstimate) {
        return tile.estimate + tile.travelCost;
    }

    // return array of tiles sorted by their score
    private getFreeAdjacentTiles(currentPos: Position, board: Board, currentTravelCost: number, targetPos: Position): CostedPosition[] {
        return board.getFreeMovementNeighbors(currentPos).map(neighbor => {
            //position to costed position conversion
            return {
                x: neighbor.x,
                y: neighbor.y,
                estimate: this.getEstimate(neighbor, targetPos),
                travelCost: currentTravelCost + 1
            } as CostedPosition
        }).sort((a, b) => {
            return this.getTileScore(a) > this.getTileScore(b) ? 1 : 0;
        });
    }

    private getAdjacentFromClosedList<T extends Position>(closedList: T[], currentPos: Position): T[] {
        //clever.  is my x or y one away from target.  No diagonal considerations because this is for movement.
        return closedList.filter((tile) => {
            return this.isInNeighboringColumn(tile, currentPos) && this.isSameRow(tile, currentPos) ||
                this.isSameColumn(tile, currentPos) && this.isInNeighboringRow(tile, currentPos);
        });
    }

    private isInNeighboringRow(tile: Position, currentPos: Position): boolean {
        return Math.abs(tile.y - currentPos.y) == 1
    }

    private isInNeighboringColumn(tile: Position, currentPos: Position): boolean {
        return Math.abs(tile.x - currentPos.x) == 1
    }

    private isSameRow(tile: Position, currentPos: Position): boolean {
        return Math.abs(tile.y - currentPos.y) == 0
    }

    private isSameColumn(tile: Position, currentPos: Position): boolean {
        return Math.abs(tile.x - currentPos.x) == 0
    }

    /** returns true if added, false if the position is already in the list */
    private addUniquePointToArray(point: Position, array: Position[]): boolean {
        if (this.checkIfPointInList(point, array)) {
            return false;
        }
        array.push(point);
        return true;
    }

    /** returns true if the position is in the list, false if it is not */
    private checkIfPointInList(point: Position, list: Position[]): boolean {
        return list.filter((el) => {
            return this.isSamePosition(el, point);
        }).length > 0;
    }
}