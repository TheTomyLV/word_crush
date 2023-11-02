
async function postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }


class Letter {
    constructor(letter, x, y, delay=0){
        this.letter = letter;
        this.size = 0;
        this.x = x+0.475;
        this.y = 0.475;
        this.posX = x;
        this.posY = y;
        this.yVel = 0;
        this.xVel = 0;
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
        if(this.posY<game.board.height-1 && !game.board[this.posX][this.posY+1]){
            game.board[this.posX][this.posY] = null
            this.posY += 1;
            game.board[this.posX][this.posY] = this;
            
        }
        let change = (0.95-this.size)/10;
        this.size += change;
        this.x -= change/2;
        this.y -= change/2;
        if(this.y<this.posY){
            this.yVel+=0.003;
            this.y+=this.yVel;         
            if(this.y>this.posY){
                this.y = this.posY;
                this.yVel = 0;
            }else{
                game.interactable = false;
            }
        }
        if(this.y>this.posY){
            this.yVel-=0.01;
            this.y+=this.yVel;
            if(this.y<this.posY){
                this.y = this.posY;
                this.yVel = 0;
            }else{
                game.interactable = false;
            }
        }
        if(this.x<this.posX){
            this.xVel+=0.01;
            this.x+=this.xVel;
            if(this.x>this.posX){
                this.x = this.posX;
                this.xVel = 0;
            }else{
                game.interactable = false;
            }
        }
        if(this.x>this.posX){
            this.xVel-=0.01;
            this.x+=this.xVel;
            if(this.x<this.posX){
                this.x = this.posX;
                this.xVel = 0;
            }else{
                game.interactable = false;
            }
        }
    }
}

class Game {
    gameReady = false
    lettersToAdd = []
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

    async #generateNewBoard(width, height){
        let board = await postData("/newGame", { width: width, height: height })
        if(!board){
            return
        }

        this.board = [];
        for(let x = 0;x<board.width;x++){
            this.board.push([])
            this.lettersToAdd.push([]);
            this.lettersToAdd[x].timer = 0;
            for(let y = 0;y<board.height;y++){
                this.lettersToAdd[x].push(board.board[x][y])
            }
        }
        
        this.board.width = board.width;
        this.board.height = board.height;
        this.gameReady = true
    }
    
    #newGame(){
        this.#generateNewBoard(8, 9);
    }

    async removePiece(x, y){
        this.board[x][y] = null;
        let letter = await postData("/newLetter")
        this.lettersToAdd[x].push(letter[0])
    }

    async swapLetters(letter1, letter2){
        let xDiff = Math.abs(letter1.posX-letter2.posX);
        let yDiff = Math.abs(letter1.posY-letter2.posY)
        if( xDiff == 1 && yDiff == 0 || xDiff == 0 && yDiff == 1){
            let res = await postData("/swap", { x1: letter1.posX, y1: letter1.posY, x2: letter2.posX, y2: letter2.posY })
            if(!res.canSwap){
                return
            }
            
            this.board[letter1.posX][letter1.posY] = letter2;
            this.board[letter2.posX][letter2.posY] = letter1;
            let pos1X = letter1.posX;
            let pos1Y = letter1.posY;
            letter1.posX = letter2.posX;
            letter1.posY = letter2.posY;
            letter2.posX = pos1X;
            letter2.posY = pos1Y;
            let word = ""
            for( let i=0;i<res.changes.length;i++){
                let x = res.changes[i][0];
                let y = res.changes[i][1]
                word += this.board[x][y].letter
                this.removePiece(x, y)
            }
            console.log(word)
        }
    }


    updateTick(){
        if(!this.gameReady){
            return
        }
        this.#clearCanvas();
        let ctx = this.ctx;
        
        this.canvas.height = this.canvas.width*this.board.height/this.board.width;
        let boxSize = (this.canvas.width/this.board.width);
        this.interactable = true;

        //Add new letters from buffer
        for(let i = 0; i<this.lettersToAdd.length;i++){
            let letter = this.lettersToAdd[i]
            if (!letter){
                continue
            }
            this.lettersToAdd[i].timer += 20;
            if(this.lettersToAdd[i].timer > 250 && letter.length>0 && !this.board[i][0]){
                this.board[i][0] = new Letter(letter.shift(), i, 0);
                this.lettersToAdd[i].timer = 0;
            }
        }

        //Call each letter update function
        for(let x = 0;x<this.board.width;x++){
            for(let y = 0;y<this.board.height;y++){
                let letter = this.board[x][y];
                if (!letter){
                    continue
                }
                let touching = this.mouseX > letter.x*boxSize && this.mouseX < letter.x*boxSize+boxSize*letter.size && this.mouseY > letter.y*boxSize && this.mouseY<letter.y*boxSize+boxSize*letter.size;
                letter.updateTick(this, touching);
            }
        }

        //Render each letter and handle swaping
        for(let x = 0;x<this.board.width;x++){
            for(let y = 0;y<this.board.height;y++){
                let letter = this.board[x][y];
                if (!letter){
                    continue
                }
                let touching = this.mouseX > letter.x*boxSize && this.mouseX < letter.x*boxSize+boxSize*letter.size && this.mouseY > letter.y*boxSize && this.mouseY<letter.y*boxSize+boxSize*letter.size;
                if(this.interactable && touching && this.mouseDown){
                    if(this.selected && this.selected.posX == letter.posX && this.selected.posY == letter.posY){
                        this.selected = null;
                    }else{
                        if(this.selected){
                            this.swapLetters(this.selected, letter);
                            this.selected = null;
                            this.interactable = false;
                        }else{
                            this.selected = letter;
                        }
                    }
                }
                
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
        this.mouseDown = false;   
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
    });/*
    addEventListener("mouseup", (evt) => {
        game.mouseDown = false;    
    });
    addEventListener("touchend", (evt) => {
        evt.preventDefault();
        game.mouseDown = false;    
    });*/
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