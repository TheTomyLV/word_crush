window.intervalIds = [];

//origianl interval function
const originalIntervalFn = window.setInterval;

//overriding the origianl
window.setInterval = function(fn, delay){
  const id = originalIntervalFn(fn, delay);
  //storing the id of each interval
  intervalIds.push(id);
  return id;
}

window.clearAllInterval = function(){
    while(intervalIds.length){
      window.clearInterval(intervalIds.pop());
    }
  }

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


function endGame(){
    let gameSpace = document.getElementById("gameSpace");
    gameSpace.style.display = "none";
    document.getElementById("startDiv").style.display = "block";
    document.getElementById("playerName").value = "";
    gameSpace.replaceWith(gameSpace.cloneNode(true));
    window.clearAllInterval();
}


class Letter {
    constructor(letter, x, y, delay=0){
        this.letter = letter;
        this.size = 0;
        this.x = x;
        this.y = 0.475;
        this.posX = x;
        this.posY = y;
        this.yVel = 0;
        this.xVel = 0;
        this.retX = null;
        this.retY = null;
        this.timer = 0;
        this.delay = delay;
        this.color = "#D2E9E9";
        this.rotation = 0;
        this.speed = 0.01;
        
    }

    updateTick(game, mouseOver){
        
        if(game.selected && game.selected.posX == this.posX && game.selected.posY == this.posY){
            this.color = "#C4DFDF";
            this.size += (1-this.size)/10;
            this.rotation = Math.sin(this.timer/50)/20;
        }else if(mouseOver){
            this.color = "#C4DFDF";
            this.rotation=0;
            this.size += (1-this.size)/10;
        }else{
            this.color = "#D2E9E9";
            this.rotation=0;
            this.size += (0.95-this.size)/10;
        }
        if(this.posY<game.board.height-1 && !game.board[this.posX][this.posY+1]){
            game.board[this.posX][this.posY] = null
            this.posY += 1;
            game.board[this.posX][this.posY] = this;
            
        }
        
        if(this.y<this.posY){
            this.yVel+=this.speed;
            this.y+=this.yVel;         
            if(this.y>this.posY){
                this.y = this.posY;
                this.yVel = 0;
                if(this.retX != null)this.posX = this.retX;
                if(this.retY != null)this.posY = this.retY;
                this.retX = null;
                this.retY = null;
            }else{
                game.interactable = false;
            }
        }
        if(this.y>this.posY){
            this.yVel-=this.speed;
            this.y+=this.yVel;
            if(this.y<this.posY){
                this.y = this.posY;
                this.yVel = 0;
                if(this.retX != null)this.posX = this.retX;
                if(this.retY != null)this.posY = this.retY;
                this.retX = null;
                this.retY = null;
            }else{
                game.interactable = false;
            }
        }
        if(this.x<this.posX){
            this.xVel+=this.speed;
            this.x+=this.xVel;
            if(this.x>this.posX){
                this.x = this.posX;
                this.xVel = 0;
                if(this.retX != null)this.posX = this.retX;
                if(this.retY != null)this.posY = this.retY;
                this.retX = null;
                this.retY = null;
            }else{
                game.interactable = false;
            }
        }
        if(this.x>this.posX){
            this.xVel-=this.speed;
            this.x+=this.xVel;
            if(this.x<this.posX){
                this.x = this.posX;
                this.xVel = 0;
                if(this.retX != null)this.posX = this.retX;
                if(this.retY != null)this.posY = this.retY;
                this.retX = null;
                this.retY = null;
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
        let name = document.getElementById("playerName").value;
        let board = await postData("/newGame", { width: width, height: height, username: name })
        if(!board){
            return
        }

        this.board = [];
        this.timer = 0;
        for(let x = 0;x<board.width;x++){
            this.board.push([])
            this.lettersToAdd.push([]);
            this.lettersToAdd[x].timer = 0;
            for(let y = board.height-1;y>=0;y--){
                this.lettersToAdd[x].push(board.board[x][y])
            }
        }
        
        this.board.width = board.width;
        this.board.height = board.height;
        this.gameReady = true
    }
    
    #newGame(){
        this.timer = 0;
        this.#generateNewBoard(parseInt(document.getElementById("optionThick").value), parseInt(document.getElementById("optionHeight").value));
        this.deletedLetters = []
    }

    async swapLetters(letter1, letter2){
        let xDiff = Math.abs(letter1.posX-letter2.posX);
        let yDiff = Math.abs(letter1.posY-letter2.posY)
        if( xDiff == 1 && yDiff == 0 || xDiff == 0 && yDiff == 1){
            let res = await postData("/swap", { x1: letter1.posX, y1: letter1.posY, x2: letter2.posX, y2: letter2.posY })
            if(res.gameEnded){
                endGame();
            }
            let pos1X = letter1.posX;
            let pos1Y = letter1.posY;
            letter1.posX = letter2.posX;
            letter1.posY = letter2.posY;
            letter2.posX = pos1X;
            letter2.posY = pos1Y;
            if(!res.canSwap){
                let pos1X = letter1.posX;
                let pos1Y = letter1.posY;
                letter1.retX = letter2.posX;
                letter1.retY = letter2.posY;
                letter2.retX = pos1X;
                letter2.retY = pos1Y;
                return
            }
            this.board[letter2.posX][letter2.posY] = letter2;
            this.board[letter1.posX][letter1.posY] = letter1;

            let points = document.getElementById("points")
            points.innerHTML = res.points;
            let moves = document.getElementById("moves")
            moves.innerHTML = res.moves;
            let word = ""
            this.deletedLetters = []
            for( let i=0;i<res.removed.length;i++){
                let x = res.removed[i][0];
                let y = res.removed[i][1];
                word += this.board[x][y].letter;
                
                let letter = this.board[x][y]
                letter.posX = i;
                letter.posY = this.board.height+0.5;
                letter.speed = 0.02;
                this.deletedLetters.push(letter)
                this.board[x][y] = null;
            }
            for(let i = 0;i<res.added.length;i++){
                for(let j in res.added[i]){
                    this.lettersToAdd[i].push(res.added[i][j])
                }
                
            }
        }
    }

    drawLetter(letter, boxSize){
        let ctx = this.ctx;
        ctx.fillStyle = letter.color;
        ctx.translate((letter.x+0.475)*boxSize, (letter.y+0.475)*boxSize);
        ctx.rotate( letter.rotation );
        ctx.translate( -letter.size/2*boxSize, -letter.size/2*boxSize );
        ctx.beginPath();
        ctx.roundRect(0, 0, boxSize*letter.size, boxSize*letter.size, 5)
        ctx.fill()
        ctx.fillStyle = "black";
        ctx.font = `${letter.size*boxSize}px serif`;
        ctx.fillText(letter.letter, (letter.size/2-0.2)*boxSize, (letter.size/2+0.25)*boxSize)
        ctx.resetTransform();
    }


    updateTick(){
        let timer = document.getElementById("timer")
        this.timer += 20;
        let minutes = Math.floor(this.timer/1000/60);
        let seconds = Math.floor(this.timer/1000)%60;
        if(seconds.toString().length == 1){
            seconds = "0"+seconds;
        }
        if(minutes.toString().length == 1){
            minutes = "0"+minutes;
        }
        timer.innerHTML = minutes+":"+seconds;
        this.timer += 20;
        if(this.delay>this.timer){
            return;
        }
        if(!this.gameReady){
            return
        }
        this.#clearCanvas();
        
        this.canvas.height = this.canvas.width*(this.board.height+1)/this.board.width+30;
        let boxSize = (this.canvas.width/this.board.width);
        this.interactable = true;

        //Add new letters from buffer
        for(let i = 0; i<this.lettersToAdd.length;i++){
            let letter = this.lettersToAdd[i]
            if (!letter){
                continue
            }
            this.lettersToAdd[i].timer += 20;
            if(this.lettersToAdd[i].timer > 150 && letter.length>0 && !this.board[i][0]){
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
                
                this.drawLetter(letter,boxSize)
            }
        }

        //Render guessed letters
        for(let i = 0; i<this.deletedLetters.length;i++){
            let letter = this.deletedLetters[i]
            if (!letter){
                continue
            }
            letter.updateTick(this, false);
            this.drawLetter(letter,boxSize)
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