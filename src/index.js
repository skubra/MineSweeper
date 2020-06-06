import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
// import * as serviceWorker from './serviceWorker';
import { FormControl, InputGroup, Button, Container, Row } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCarrot, FaBomb, FaSyncAlt, FaRegClock } from 'react-icons/fa'

class Square extends React.Component {
	constructor(props) {
		super(props);
		this.onclick = props.onClick;

		var color = '';
		if (Number(props.id) % 2 === 0)
			color += 'dark ';

		this.state = {
			className: 'square',
			colorClass: color,
			value: ""
		}

	}

	setValue(val) {
		if (val === -2) {
			this.setState({ value: <FaCarrot />, className: 'square flag flipped' });
		}
		else if (val === -1) {
			this.setState({ value: <FaBomb />, className: 'square bomb flipped' });
		}
		else if (val === -4 || val === 0) {
			this.setState({ value: '', className: 'square opened flipped' });
		}
		else {
			this.setState({ value: val, className: 'square opened flipped' });
		}

	}


	render() {
		return (
			<button className={this.state.colorClass + this.state.className} onClick={this.onclick} onContextMenu={this.onclick}>
				{this.state.value}
			</button>
		);
	}
}

class Board extends React.Component {
	constructor(props) {
		super(props);

		this.buttons = [];
		var board_prop = this.getBoardProp(Number(props.width), Number(props.height), Number(props.bomb_count));
		this.bomb_count = props.bomb_count;

		this.state = {
			width: Number(props.width),
			height: Number(props.height),
			board: board_prop.board,
			bombs: board_prop.bombs
		};

	}

	getBoardProp(width, height, bomb_count) {
		var _bombs = [];
		for (var b = 0; b < Number(bomb_count); b++) {
			var rand = Math.floor(Math.random() * (width * height));
			_bombs.push(rand);
		}

		var _board = [];
		for (var i = 0; i < width; i++) {
			for (var j = 0; j < height; j++) {
				if (_bombs.indexOf(i * width + j) > -1)
					_board.push(-1);
				else _board.push(0);
			}
		}

		for (var bt = 0; bt < width * height; bt++)
			this.buttons.push(null);

		return { board: _board, bombs: _bombs }
	}

	setSize(width, height, bomb_count) {
		var board_prop = this.getBoardProp(width, height, bomb_count);

		this.setState({
			width: width, height: height, board: board_prop.board, bombs: board_prop.bombs
		}, function () {
			console.log('updated');
		});

	}

	checkIfBomb(cell_no) {
		if (cell_no === -1) return false;
		return this.state.bombs.indexOf(cell_no) > -1;
	}

	getCellNo(row, col) {
		if (row < 0 || col < 0 || row >= this.state.width || col >= this.state.height) return -1;
		return row * this.state.width + col;
	}

	setProp(cell_no, prop) {
		if (prop === 2) { //flagged
			this.setCellProp(cell_no, -2);
		}
		else {
			var bomb_neighbors = this.checkNeighbors(cell_no);
			this.setCellProp(cell_no, bomb_neighbors);
			if (bomb_neighbors === 0) {
				this.bfs(cell_no, 1);
			}		
		}
	}

	bfs(cell_no, depth){
		if (depth >= 3) return;
		var row = Math.floor(cell_no / this.state.width);
		var col = cell_no - row * this.state.width;

		if (row < 0 || col < 0 || row >= this.state.width || col >= this.state.height) return;

		if(this.checkNeighbors(cell_no) === 0) {
			this.setCellProp(cell_no, 0);
			for (var i = -1; i < 2; i++)
				for (var j = -1; j < 2; j++) {
					var _cell_no = this.getCellNo(row + i, col + j);
					if(_cell_no === -1) continue;
					this.setCellProp(_cell_no, this.checkNeighbors(_cell_no));
					this.bfs(this.getCellNo(row + i, col + j), depth+1);
				}
		}
		else return;
	}

	checkNeighbors(cell_no) {
		var row = Math.floor(cell_no / this.state.width);
		var col = cell_no - row * this.state.width;
		var bomb_neighbors = 0;
		for (var i = -1; i < 2; i++)
			for (var j = -1; j < 2; j++)
				if (this.checkIfBomb(this.getCellNo(row + i, col + j)))
					bomb_neighbors += 1;
		return bomb_neighbors;
	}

	setCellProp(cell_no, val) {
		const newBoard = [
			...this.state.board.slice(0, cell_no),
			val,
			...this.state.board.slice(cell_no + 1)
		]

		this.setState({ board: newBoard }, function () {
			this.buttons[cell_no].setValue(val);
		});
	}

	getRemainingBombs() {
		const countTypes = this.state.board.filter(cell => cell === -2);
        return this.bomb_count - countTypes.length;
	}

	gameOver() {
		var width = this.state.width;
		var height = this.state.height;
		for (var i = 0; i < width; i++)
			for (var j = 0; j < height; j++) {
				if (this.checkIfBomb(i * width + j))
					this.buttons[i * width + j].setValue(-1);
				else this.buttons[i * width + j].setValue(-4); //empty        
			}

	}

	renderSquare(i) {
		return (
			<Square
				value={this.state.board[i]}
				onClick={() => this.props.onClick(i)}
				ref={instance => { this.buttons[i] = instance; }}
				key={i}
				id={i}
			/>
		);
	}

	renderBoard() {
		var width = this.state.width;
		var height = this.state.height;

		var board_html = [];
		for (var i = 0; i < width; i++) {
			var row_html = [];
			for (var j = 0; j < height; j++) {
				row_html.push(this.renderSquare(i * width + j));
			}
			board_html.push(<div className="board-row" key={i}> {row_html} </div>);
		}
		return board_html;
	}

	render() {
		return (
			<div>
				{this.renderBoard()}
			</div>
		);
	}
}

class Game extends React.Component {
	constructor(props) {
		super(props);
		this.width = { value: '11' };
		this.height = { value: '11' };

		this.handleBoardWidth = this.handleBoardWidth.bind(this);
		this.handleBoardHeight = this.handleBoardHeight.bind(this);
		this.handleBombCount = this.handleBombCount.bind(this);
		this.handleBoardRender = this.handleBoardRender.bind(this);
		this.tick = this.tick.bind(this);

		this.stepNo = 0;
		this.bomb_count = 20;
		this.board_ref = null;

		this.state = {
			board: <Board width={this.width.value}
				height={this.height.value}
				bomb_count={this.bomb_count}
				ref={instance => { this.board_ref = instance; }}
				onClick={i => this.handleCellClick(i)}
			/>,
			remaining_bombs : this.bomb_count,
			elapsed : 0
		};

		document.addEventListener('contextmenu', event => event.preventDefault());
		document.addEventListener('mousedown', this.handleClicks, false);
		setInterval(this.tick, 1000);

		this.clicktype = 0;
	}

	tick(){
		this.setState({elapsed : this.state.elapsed + 1});
	}

	handleClicks = (e) => {
		this.clicktype = e.button;
	}

	handleBoardWidth(event) {
		var val = Number(event.target.value);
		if (val % 2 === 0) val += 1;
		this.width.value = val;
	}

	handleBoardHeight(event) {
		var val = Number(event.target.value);
		if (val % 2 === 0) val += 1;
		this.height.value = val;
	}

	handleBombCount(event) {
		this.bomb_count = event.target.value;
	}

	handleBoardRender(event) {
		this.board_ref.setSize(this.width.value, this.height.value, this.bomb_count);
	}

	handleRemainingBombs( remaining_bombs) {
		this.setState({remaining_bombs : remaining_bombs });
	}

	handleCellClick(cell_no) {
		var is_bomb = this.board_ref.checkIfBomb(cell_no);
		if (this.clicktype !== 2 && is_bomb === true) {
			console.log('Game over');
			this.board_ref.gameOver();
			return;
		}

		this.board_ref.setProp(cell_no, this.clicktype);
		this.handleRemainingBombs(this.board_ref.getRemainingBombs());
	}

	render() {
		return (
			<Container>
				<div className="game p-3">
					<Row>
						<div className="game-options text-center">
							<InputGroup className="mb-2 game-options" size="sm">
								<FormControl type="text" placeholder="Board Width" onChange={this.handleBoardWidth} />
								<FormControl type="text" placeholder="Board Height" onChange={this.handleBoardHeight} />
								<FormControl type="text" placeholder="Bomb Count" onChange={this.handleBombCount} />
								
								<InputGroup.Append>
									<Button className="mr-2" variant="outline-secondary" onClick={this.handleBoardRender}>Render</Button>
								</InputGroup.Append>

								<Button className="m-0" size="sm" variant="outline-success" onClick={() => window.location.reload(false)}><FaSyncAlt /></Button>
							</InputGroup>

							<InputGroup className="mb-2 game-options" size="sm">
								<InputGroup.Prepend>
									<InputGroup.Text>#Remaining Bombs: </InputGroup.Text>
								</InputGroup.Prepend>
								<FormControl className="mr-2" type="text" placeholder={this.state.remaining_bombs}  />

								<InputGroup.Prepend>
									<InputGroup.Text><FaRegClock /> </InputGroup.Text>
								</InputGroup.Prepend>
								<FormControl type="text" placeholder={this.state.elapsed}  />
								<InputGroup.Append>
									<InputGroup.Text>sec</InputGroup.Text>
								</InputGroup.Append>
							</InputGroup>
			

						</div>
					</Row>
					<br />
					<Row>
						<div className="game-board">
							{this.state.board}
						</div>
					</Row>
				</div>
			</Container>
		);
	}
}

// Render

ReactDOM.render(<Game />, document.getElementById("root"));

