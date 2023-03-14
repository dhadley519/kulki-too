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

export type FailedPathResult = PathResult

export interface SuccessfulPathResult extends PathResult {
	finalPath: CostedPosition[];
}

export interface ColorAndPosition extends Position {
	color: number;
}

enum PathClass {
	openList = 'openList', closedList = 'closedList', finalPath = 'finalPath'
}

enum CssClasses {
	ball = 'ball'
}

class BoardView {
	private readonly tileNodes: Array<Array<HTMLElement>>; // two-dimensional array of tiles
	private selectedTilePosition: Position | undefined; // tile with selected ball (first click to select, second click to move)
	private pathResponse: PathResult | undefined; // only for moving active ball
	constructor(boardSize: BoardSize) {
		const boardElement = document.querySelector('#board');
		if (!boardElement) {
			console.error("abort, can't find board element")
			this.tileNodes = [];
			return;
		}
		this.tileNodes = new Array<HTMLElement[]>();
		for (let rowPosition = 0; rowPosition < boardSize.depth; rowPosition++) {
			const row = Array<HTMLElement>();
			const rowElement: HTMLElement = document.createElement('div');
			rowElement.classList.add('board__row');
			for (let tileInRowPosition = 0; tileInRowPosition < boardSize.width; tileInRowPosition++) {
				const tile: HTMLElement = document.createElement('div');
				tile.classList.add('board__row__tile');
				tile.dataset['xPosition'] = tileInRowPosition.toString();
				tile.dataset['yPosition'] = rowPosition.toString()
				tile.addEventListener('click', this.onClick());
				tile.addEventListener('mouseover', this.onMouseOver());
				rowElement.appendChild(tile);
				row.push(tile);
			}
			boardElement.appendChild(rowElement);
			this.tileNodes.push(row);
		}
	}

	clearPaths(): void {
		this.tileNodes.forEach(row => {
			row.forEach(tile => {
				tile.classList.remove(PathClass.openList);
				tile.classList.remove(PathClass.closedList);
				tile.classList.remove(PathClass.finalPath);
			});
		});
	}

	start() {
		const init = {
			method: "GET",
		};
		fetch("http://localhost:3000/start", init)
			.then(response => response.json())
			.then(data => this.processAddCommands(data as AddBall[]))
			.catch(reason => console.error(`failure to start game. ${JSON.stringify(reason)}`));
	}

	private processAddCommands(commands: Array<(AddBall)>) {
		commands.forEach(n => {
			this.addNewBallOfColor(n);
		});
	}

	private hasBall(position: Position): boolean {
		const row = this.tileNodes[position.y]
		if (row) {
			const tile = row[position.x]
			if (tile) {
				return !!tile.firstChild;
			}
		}
		return false;
	}

	private addNewBallOfColor(colorAndPosition: ColorAndPosition): boolean {
		const ballElement = document.createElement('div');
		ballElement.classList.add(CssClasses.ball);
		ballElement.classList.add(`color${colorAndPosition.color}`);
		ballElement.dataset['color'] = colorAndPosition.color.toString();
		const row = this.tileNodes[colorAndPosition.y];
		if (row) {
			const tile = row[colorAndPosition.x];
			if (tile && tile.childNodes.length == 0) {
				tile.appendChild(ballElement);
				return true;
			}
		}
		console.error(`failed to add ball. ${JSON.stringify(colorAndPosition)}`)
		return false;
	}

	private removeBall(position: Position): boolean {
		const row = this.tileNodes[position.y];
		if (row) {
			const tile = row[position.x];
			if (tile) {
				const ball = tile.firstChild;
				if (ball) {
					ball.remove();
					return true;
				}
			}
		}
		console.error(`failed to remove ball. ${JSON.stringify(position)}`)
		return false;
	}

	private getTilePosition(target: HTMLElement | undefined): Position | undefined {
		if (!target) {
			console.error(`call to get Tile Position without target element`);
			return;
		}
		if (target.classList.contains('board__row__tile')) {
			const x: string | undefined = target.dataset['xPosition']
			const y: string | undefined = target.dataset['yPosition']
			if (x && y) {
				return { x: parseInt(x), y: parseInt(y) }
			}
		}
		const parent = target.parentNode;
		if (parent instanceof HTMLElement) {
			return this.getTilePosition(parent )
		}
		console.error(`get Tile Position fall through failure.`)
		return;
	}

	private select(selectedTilePosition: Position): boolean {
		const row = this.tileNodes[selectedTilePosition.y];
		if (row) {
			const tile = row[selectedTilePosition.x];
			if (tile) {
				const ball = tile.firstChild as HTMLElement;
				if (ball) {
					if (this.selectedTilePosition) {
						this.unselect(this.selectedTilePosition);
					}
					this.selectedTilePosition = selectedTilePosition;
					ball.classList.add('selected');
					return true;
				}
			}
		}
		console.error(`failed to select ${JSON.stringify(selectedTilePosition)}`)
		return false;
	}

	private unselect(selectedTilePosition: Position): boolean {
		const row = this.tileNodes[selectedTilePosition.y];
		if (row) {
			const tile = row[selectedTilePosition.x];
			if (tile) {
				const ball = tile.firstChild;
				if (ball && ball instanceof HTMLElement) {
					ball.classList.remove('selected');
					return true;
				}
			}
		}
		console.error(`failed to unselect ${JSON.stringify(selectedTilePosition)}`);
		return false;
	}

	private onMouseOver() {
		return (event: MouseEvent): void => {
			// if there is selected tile and target has no child(tile with no ball) and target is not ball:
			const tilePosition = this.getTilePosition(event.target as HTMLElement);
			if (tilePosition && this.selectedTilePosition) {
				const hovPos: MovePath = {
					to: tilePosition, from: this.selectedTilePosition
				}
				const init = {
					method: "POST", headers: {
						"Content-Type": "application/json",
					}, body: JSON.stringify(hovPos)
				};
				fetch("http://localhost:3000/hover", init)
					.then(response => response.json())
					.then(data => {
						this.clearPaths();
						this.pathResponse = data as PathResult;
						this.highlightFinalPath();
					})
					.catch(reason => console.error(`failure to get path response. ${JSON.stringify(reason)}`));
			}
		}
	}

	private getTileFromEventTarget(eventTarget: HTMLElement): HTMLElement {
		//if you clicked on a ball return parent (a tile) otherwise return what you clicked on ( a tile).
		if (eventTarget.classList.contains(CssClasses.ball) && eventTarget.parentNode) {
			const tile = eventTarget.parentNode;
			if (tile instanceof HTMLElement) {
				return tile;
			}
		}
		return eventTarget;
	}

	private isSamePosition(positionA: Position | undefined, positionB: Position | undefined): boolean {
		return !!(positionA && positionB && positionA.x == positionB.x && positionA.y == positionB.y);
	}

	private onClick() {
		return (event: MouseEvent): void => {
			this.clearPaths();
			const clickedPos = this.getTilePosition(this.getTileFromEventTarget(event.target as HTMLElement))
			if (!clickedPos) {
				console.error('received click without corresponding tile position.')
				return;
			}
			if (this.hasBall({ x: clickedPos.x, y: clickedPos.y })) {
				if (this.isSamePosition(this.selectedTilePosition, clickedPos)) {
					this.unselect(clickedPos);
				} else {
					this.select({ x: clickedPos.x, y: clickedPos.y });
				}
			} else { // if there is no ball on clicked tile
				this.moveSelectedTileTo(clickedPos);
			}
		};
	}

	private isBoardConsistentAndUpToDate(clickedPos: Position): boolean {
		//we care clicking on a position for which the hover isPathClear has been accurately set from the current selected and clicked position
		return !!(this.isSamePosition(clickedPos, this.pathResponse?.to) && this.isSamePosition(this.pathResponse?.from, this.selectedTilePosition) && this.pathResponse?.success);
	}

	private moveSelectedTileTo(clickedPos: Position): boolean {
		if (this.isBoardConsistentAndUpToDate(clickedPos)) {
			//send move request
			const init = {
				method: "POST", headers: {
					"Content-Type": "application/json",
				}, body: JSON.stringify({
					from: this.selectedTilePosition, to: clickedPos, serverSideMoveSuccess: false
				})
			};
			fetch("http://localhost:3000/move", init)
				.then(response => response.json())
				.then(data => this.processAddAndRemoveCommands(data as (AddBall|RemoveBall)[]))
				.catch(reason => console.error(`failure to move. ${JSON.stringify(reason)}`));
			return true;
		}
		console.error(`board is not consistent.  move attempt ${JSON.stringify(this.selectedTilePosition)} to ${JSON.stringify(clickedPos)}, ${JSON.stringify(this.pathResponse)}`);
		return false;
	}

	private processAddAndRemoveCommands(commands: Array<(AddBall | RemoveBall)>) {
		this.selectedTilePosition = undefined;
		commands.forEach(n => {
			switch (n.command) {
				case "ADD": {
					this.addNewBallOfColor(n);
					break;
				}
				case "REMOVE": {
					this.removeBall(n);
					break;
				}
				default: {
					console.error(`command match fallthrough ${JSON.stringify(n)}`);
				}
			}
		});
		this.updateStats();
	}

	private updateStats(): void {
		const init = {
			method: "GET"
		};
		fetch("http://localhost:3000/statistics", init)
			.then(response => response.json())
			.then(data => {
				const tileCountElement: Element | null = document.querySelector('#emptyTiles');
				if (tileCountElement) {
					tileCountElement.innerHTML = (data as Statistics).emptyTileCount.toString();
				}
				const scoreElement: Element | null = document.querySelector('#score');
				if (scoreElement) {
					scoreElement.innerHTML = (data as Statistics).score.toString();
				}
			}).catch(reason => console.error(`failure to get statistics. ${JSON.stringify(reason)}`));
	}

	private highlightFinalPath() {
		if (this.pathResponse?.success) {
			const successfulPathResult = this.pathResponse as SuccessfulPathResult
			successfulPathResult.finalPath.forEach(position => {
				const row = this.tileNodes[position.y];
				if (row) {
					const tile = row[position.x];
					if (tile) {
						tile.classList.add(PathClass.finalPath);
					}
				}
			});
		}
	}
}

new BoardView({ width: 9, depth: 9 }).start();
