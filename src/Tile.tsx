import React, {useState} from "react";
import {BallState, Position, SelectAndTargetState} from "./Game";
import {v4 as uuidv4} from 'uuid';

export function Tile(position: Position, initialState: BallState, boardDispatch: React.Dispatch<SelectAndTargetState>): JSX.Element {

    const [ballState, setBallState] = useState(initialState);

    if (!(ballState.visible === initialState.visible && ballState.color === initialState.color && ballState.selected === initialState.selected)) {
        setBallState(initialState);
    }

    function updateBallState(state: BallState, action: BallState): BallState {
        console.log("updateBallState", state, action);
        return {
            visible: action.visible,
            color: action.color,
            selected: action.selected
        } as BallState;
    }

    function handleTileClick(e: React.MouseEvent<HTMLDivElement>) {
        console.log("handleTileClick", e);
        if (ballState.visible && ballState.selected) {
            //unselect
            setBallState({visible: ballState.visible, color: ballState.color, selected: false} as BallState)
            boardDispatch({selectedBall: null} as SelectAndTargetState)
            e.stopPropagation()
            return;
        }
        if (ballState.visible && !ballState.selected) {
            //select
            setBallState({visible: true, color: ballState.color, selected: true} as BallState)
            boardDispatch({selectedBall: position} as SelectAndTargetState)
            e.stopPropagation()
            return;
        }
        boardDispatch({targetPosition: position} as SelectAndTargetState)
        e.stopPropagation()
    }

    function handleBallClick(e: React.MouseEvent<HTMLDivElement>) {
        console.log("handleBallClick", e);
    }

    return (

        <div onClick={handleTileClick} key={uuidv4()} className='board__row__tile'
             data-x-position={position.x} data-y-position={position.y}>
            <div onClick={handleBallClick} key={uuidv4()}
                 className={`ball color${ballState.color} ${(ballState.selected ? 'selected' : '')}`}
                 data-color={ballState.color}
                 style={ballState.visible ? {} : {display: 'none'}}/>
        </div>
    );
}