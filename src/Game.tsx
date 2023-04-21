import React, {useEffect, useReducer} from "react";
import {Tile} from "./Tile";
import {v4 as uuidv4} from 'uuid';

export interface BoardSize {
    readonly width: number;
    readonly depth: number;
}

export interface Statistics {
    emptyTileCount: number;
    score: number;
}

export interface TravelCostEstimate {
    travelCost: number;
    readonly estimate: number;
}

export interface CostedPosition extends Position, TravelCostEstimate {
}

export interface Position {
    readonly x: number;
    readonly y: number;
}

export interface GameOver {
    command: 'GAME_OVER';
}

export interface AddBall extends ColorAndPosition {
    command: 'ADD';
}

export interface RemoveBall extends Position {
    command: 'REMOVE';
}

export interface MovePath {
    from: Position;
    to: Position;
}

export interface PathResult extends MovePath {
    success: boolean;
    openList: CostedPosition[];
    closedList: CostedPosition[];
}

export interface SuccessfulPathResult extends PathResult {
    finalPath: CostedPosition[];
}

export interface ColorAndPosition extends Position {
    color: number;
}

export interface BallState {
    visible: boolean;
    color: number;
    selected: boolean;
}




export interface SelectAndTargetState {
    selectedBall: Position | null;
    targetPosition: Position | null;
}

function gameOver() {
    alert("Game Over");
}

export default function Game() {

    function Board(): React.DetailedReactHTMLElement<{ className: string; id: string }, HTMLElement> {

        const [selectAndTargetState, selectAndTargetDispatch] = useReducer(updateSelectAndTarget, {
            selectedBall: null,
            targetPosition: null
        } as SelectAndTargetState);
        const [boardState, boardDispatch] = useReducer(updateBoard, new Map() as Map<number, Map<number, BallState>>);

        useEffect(() => {
            const onPageLoad = () => {
                const init: RequestInit = {method: "GET", credentials: "include"};
                fetch("/start", init)
                    .then(response => response.json())
                    .then(data => processAddCommands(data as AddBall[]))
                    .catch(reason => console.error(`failure to start game. ${JSON.stringify(reason)}`));
            };

            // Check if the page has already loaded
            if (document.readyState === 'complete') {
                onPageLoad();
            } else {
                window.addEventListener('load', onPageLoad);
                // Remove the event listener when component unmounts
                return () => window.removeEventListener('load', onPageLoad);
            }
        }, []);


        function updateBoard(state: Map<number, Map<number, BallState>>, action: Map<number, Map<number, BallState>>): Map<number, Map<number, BallState>> {

            // //deep copy
            let m: Map<number, Map<number, BallState>> = new Map();
            state.forEach((value, y) => {
                let n: Map<number, BallState> = new Map();
                value.forEach((ballState, x) => {
                    n = n.set(x, ballState)
                    m = m.set(y, n);
                });
            });

            action.forEach((value, y) => {
                let n = m.get(y)
                value.forEach((ballState, x) => {
                    console.log("updateBoard", x, y, ballState);
                    n = n?.set(x, ballState)
                    m = m.set(y, n as Map<number, BallState>);
                })
            });
            return m;
        }

        function updateSelectAndTarget(state: SelectAndTargetState, action: SelectAndTargetState): SelectAndTargetState {
            if (state.selectedBall != null && action.targetPosition != null) {
                const init: RequestInit = {
                    credentials: "include", method: "POST", headers: {
                        "Content-Type": "application/json"
                    }, body: JSON.stringify({
                        from: state.selectedBall, to: action.targetPosition
                    })
                };
                fetch("/move", init)
                    .then(response => response.json())
                    .then(data => processAddAndRemoveCommands(data as (GameOver | AddBall | RemoveBall)[]))
                    .catch(reason => console.error(`failure to move. ${JSON.stringify(reason)}`));
                return {selectedBall: null, targetPosition: null} as SelectAndTargetState;
            }
            return action;
        }

        function processAddAndRemoveCommands(commands: Array<(GameOver | AddBall | RemoveBall)>) {

            commands.forEach(n => {
                switch (n.command) {
                    case "ADD": {
                        addNewBallOfColor(n);
                        break;
                    }
                    case "REMOVE": {
                        removeBall(n);
                        break;
                    }
                    case "GAME_OVER": {
                        gameOver();
                        break;
                    }
                    default: {
                        console.error(`command match fallthrough ${JSON.stringify(n)}`);
                    }
                }
            });

        }

        function removeBall(position: Position) {
            let m: Map<number, Map<number, BallState>> = new Map();
            let n: Map<number, BallState> = new Map();
            n.set(position.x, {visible: false, color: 0, selected: false} as BallState);
            m.set(position.y, n);
            boardDispatch(m)
        }

        function processAddCommands(commands: Array<(AddBall)>) {
            commands.forEach(n => {
                addNewBallOfColor(n);
            });
        }

        function addNewBallOfColor(colorAndPosition: ColorAndPosition) {
            let m: Map<number, Map<number, BallState>> = new Map();
            let n: Map<number, BallState> = new Map();
            n.set(colorAndPosition.x, {visible: true, color: colorAndPosition.color, selected: false} as BallState);
            m.set(colorAndPosition.y, n);
            boardDispatch(m)
        }


        const rows: JSX.Element[] = [];
        for (let rowPosition = 0; rowPosition < 9; rowPosition++) {
            let row = boardState.get(rowPosition);
            if (row == null) {
                row = new Map();
                boardState.set(rowPosition, row);
            }
            let tiles: JSX.Element[] = [];
            for (let tileInRowPosition = 0; tileInRowPosition < 9; tileInRowPosition++) {
                let ballState = row.get(tileInRowPosition)
                if (ballState == null) {
                    ballState = {visible: false, color: 0, selected: false} as BallState;
                    row.set(tileInRowPosition, ballState);
                }
                ballState.selected = (selectAndTargetState.selectedBall != null && selectAndTargetState.selectedBall.x == tileInRowPosition && selectAndTargetState.selectedBall.y == rowPosition);
                tiles.push(Tile({x: tileInRowPosition, y: rowPosition}, ballState, selectAndTargetDispatch));
            }
            rows.push(React.createElement('div', {
                key: uuidv4(),
                className: "board__row"
            }, tiles));
        }
        let foo: React.DetailedReactHTMLElement<{key: string, className: string, id: string}, HTMLElement> =  React.createElement('div', {key: uuidv4(), className: "board", id: uuidv4()}, rows);

        return foo;
    }


    return (
        <>
            <div className="board_wrapper" id="board_wrapper">
                <Board/>
            </div>
            <div className="sticky-lg-bottom">Stick to the bottom on viewports sized LG (large) or wider</div>
        </>
    )
}

