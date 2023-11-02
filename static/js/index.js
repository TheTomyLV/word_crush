class Letter {
    constructor(letter, x, y, delay=0){
        this.letter = letter;
        this.size = 0;
        this.x = x+0.475;
        this.y = 0.475;
        this.posX = x;
        this.posY = y;
        this.yVel = 0;
        this.timer = 0;
        this.delay = delay;
        this.color = "#f2f2f2";
        this.rotation = 0;
    }

    updateTick(game, mouseOver){
        this.timer += 20;
        if(this.delay>this.timer){
            return;
        }
        if(mouseOver || game.selected && game.selected.posX == this.posX && game.selected.posY == this.posY){
            this.color = "#fafafa";
            //this.rotation = Math.sin(new Date().getTime()/100);
        }else{
            this.color = "#f2f2f2";
            this.rotation=0;
        }
        let change = (0.95-this.size)/5;
        this.size += change;
        this.x -= change/2;
        this.y -= change/2;
        if(this.y<this.posY){
            this.yVel+=0.01;
            this.y+=this.yVel;
            if(this.y>this.posY){
                this.y = this.posY;
                this.yVel = 0;
            }
        }
    }
}

class Game {
    avalableLetters = ["a", "b", "c", "d", "e", "f", "g"]
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.#newGame()
        
    }

    getMousePos() {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }

    #generateNewBoard(width, height){
        this.board = [];
        for(let x = 0;x<width;x++){
            this.board.push([])
            for(let y = 0;y<height;y++){
                this.board[x].push(new Letter(this.avalableLetters[Math.floor(Math.random()*this.avalableLetters.length)], x, y, (height-y-1)*200));
            }
        }
        
        this.board.width = width;
        this.board.height = height;
    }
    
    #newGame(){
        this.#generateNewBoard(5, 6);
        
    }

    removePiece(x, y){
        for(let i = y;i>0;i--){
            this.board[x][i] = this.board[x][i-1];
            this.board[x][i].posY += 1;
        }
        this.board[x][0] = new Letter(this.avalableLetters[Math.floor(Math.random()*this.avalableLetters.length)], x, 0, 200);
    }

    updateTick(){
        this.#clearCanvas();
        let ctx = this.ctx;
        
        this.canvas.height = this.canvas.width*this.board.height/this.board.width;
        let boxSize = (this.canvas.width/this.board.width);
        for(let x = 0;x<this.board.width;x++){
            for(let y = 0;y<this.board.height;y++){
                let letter = this.board[x][y];
                let touching = this.mouseX > letter.x*boxSize && this.mouseX < letter.x*boxSize+boxSize*letter.size && this.mouseY > letter.y*boxSize && this.mouseY<letter.y*boxSize+boxSize*letter.size;
                if(touching && this.mouseDown){
                    this.removePiece(x, y);
                    continue;
                    if(this.selected && this.selected.posX == letter.posX && this.selected.posY == letter.posY){
                        this.selected = null;
                    }else{
                        this.selected = letter;
                    }
                }
                letter.updateTick(this, touching);
                ctx.fillStyle = letter.color;
                ctx.translate(letter.x*boxSize, letter.y*boxSize);
                ctx.fillRect(0, 0, boxSize*letter.size, boxSize*letter.size);
                ctx.fillStyle = "black";
                ctx.font = `${letter.size*boxSize}px serif`;
                ctx.fillText(letter.letter, (letter.size/2-0.1)*boxSize, (letter.size/2+0.25)*boxSize)
                ctx.stroke();
                ctx.resetTransform();
            }
        }

    }

    #clearCanvas(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function main() {
    const canvas = document.getElementById("gameCanvas");
    const game = new Game(canvas)
    addEventListener("mousemove", (evt) => {
        let rect = canvas.getBoundingClientRect();
        game.mouseX = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
        game.mouseY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
    });
    addEventListener("touchmove", (evt) => {
        evt.preventDefault();
        let rect = canvas.getBoundingClientRect();
        game.mouseX = (evt.touches[0].clientX - rect.left) / (rect.right - rect.left) * canvas.width;
        game.mouseY = (evt.touches[0].clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
    });
    addEventListener("mouseup", (evt) => {
        game.mouseDown = false;    
    });
    addEventListener("touchend", (evt) => {
        evt.preventDefault();
        game.mouseDown = false;    
    });
    addEventListener("mousedown", (evt) => {
        game.mouseDown = true;
    });
    addEventListener("touchstart", (evt) => {
        evt.preventDefault();
        game.mouseX = (evt.touches[0].clientX - rect.left) / (rect.right - rect.left) * canvas.width;
        game.mouseY = (evt.touches[0].clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
        game.mouseDown = true;    
    });
    let intervalId = setInterval(function() {
        
        game.updateTick();
      }, 20);
      
  }
  
  main();