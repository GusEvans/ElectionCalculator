'use strict'

/* Setup */

var input; //This is the input from the text box
var method; //This is the voting system specified in the drop-down
var round; //This is used to count the current round of the election
var threshold; //This is used to check whether a candidate's vote count has exceeded a known threshold (usually half)
var tempThreshold; //This is a changeable threshold value, used when the threshold is unknown
var preference; //This is used to store a voter's current preference
var winnerString; //This is used to display the output

var sections = []; //This array is used to split the input data
var candidates = []; //This array stores the names and numbers of candidates
var votes = []; //This array stores the votes as they appear in the ballots
var tally = []; //This array stores the points for each candidate for each round of the election
var winners = []; //This array stores the candidates that have won
var tempWinners = []; //This array stores which candidates advance to a later stage of the election
var topPreference = []; //This array is used for distributing votes correctly in IRV

var i;
var j;

document.getElementById("winners").innerHTML = "Results will appear here."

/* Button Functions */

function process() {
	/* Separate the input data */
	input = document.getElementById("data").value;
	sections = input.split("\n~~~\n");
	/* Create a list of candidates */
	candidates = sections[0].split("\n");
	console.log(candidates);
	/* Create a list of votes */
	votes = sections[1].split("\n");
	for (i = 0; i < votes.length; i+=1) {
		votes[i] = votes[i].split(",");
		for (j = 0; j < votes[i].length; j+=1) {
			votes[i][j] = Number(votes[i][j]);
		}
	}
	console.log(votes);
}

function calculate() {
	/* Calculate the results based on the method in the drop-down */
	method = document.getElementById("method").value;
	winners = []; // Note: the winners list should only be updated when a winner is CONFIRMED
	tally = [];
	if (method == "fptp") {
		fptp();
	}
	if (method == "top2") {
		top2();
	}
	if (method == "irv") {
		irv();
	}
	if (method == "bucklin") {
		bucklin();
	}
	if (method == "borda") {
		borda();
	}
	/* Display the results of the election */
	if (winners.length == 1) {
		document.getElementById("winners").innerHTML = candidates[winners] + " wins the election!"
	}
	if (winners.length < 1) {
		document.getElementById("winners").innerHTML = "A winner could not be calculated. Make sure all votes are inputted correctly, and then press \"Import Data\" again."
	}
	if (winners.length > 1) {
		winnerString = candidates[winners[0]];
		for (i = 1; i < winners.length; i+=1) {
			winnerString = winnerString + " and " + candidates[winners[i]];
		}
		document.getElementById("winners").innerHTML = "Tie between " + winnerString
	}
	console.log("Winner(s): Candidate " + winners);
}

/* Voting Systems */

function fptp() {
	console.log("First-past-the-post election");
	initializeTally(0);
	/* Calculate results for each candidate */
	firstRound();
	/* Find the winner(s) */
	threshold = 0;
	for (i = 0; i < candidates.length; i+=1) {
		if (tally[round][i] == threshold) {
			winners[winners.length] = i;
		}
		if (tally[round][i] > threshold) {
			threshold = tally[round][i]
			winners = [];
			winners[0] = i;
		}
	}
}

function top2() {
	console.log("2-round runoff election");
	initializeTally(0);
	/* Calculate first preferences */
	firstRound();
	/* Check for majority victory */
	majorityCheck();
	/* If a candidate has over half the votes, the election is over. Otherwise... */
	if (winners.length == 0) {
		console.log("No candidate received a majority of the votes, so the election continues.")
		/* Find top 2 candidates */
		tempWinners = [];
		tempThreshold = 0;
		for (i = 0; i < candidates.length; i+=1) {
			if (tally[round][i] > tempThreshold) {
				tempWinners[0] = i;
				tempThreshold = tally[round][i];
			}
		}
		tempThreshold = 0;
		for (i = 0; i < candidates.length; i+=1) {
			if (tally[round][i] > tempThreshold && i !== tempWinners[0]) {
				tempWinners[1] = i;
				tempThreshold = tally[round][i];
			}
		}
		console.log(tempWinners);
		/* Set up second round */
		round = 1;
		initializeTally(1);
		tally[1] = tally[0].slice();
		console.log(tally[round]);
		/* Distribute preferences */
		for (i = 0; i < votes.length; i+=1) {
			/* Find first preference for that vote */
			preference = candidates.length;
			for (j = 0; j < candidates.length; j+=1) {
				if (votes[i][j] == 1) {
					preference = j;
				}
			}
			if (preference == candidates.length) {
				console.log("Invalid vote detected - no first preference at vote " + i);
				break;
			}
			if (preference !== tempWinners[0] && preference !== tempWinners[1]) {
				console.log("Vote " + i + " is being distributed!");
				/* Find next preference */
				if (votes[i][tempWinners[0]] < votes[i][tempWinners[1]]) {
					tally[round][tempWinners[0]] += 1;
					tally[round][preference] -= 1;
				}
				if (votes[i][tempWinners[1]] < votes[i][tempWinners[0]]) {
					tally[round][tempWinners[1]] += 1;
					tally[round][preference] -= 1;
				}
				console.log(tally[round]);
			}
		}
		/* Calculate actual winner(s) */
		threshold = 0;
		for (i = 0; i < candidates.length; i+=1) {
			if (tally[round][i] == threshold) {
				winners[winners.length] = i;
			}
			if (tally[round][i] > threshold) {
				threshold = tally[round][i]
				winners = [];
				winners[0] = i;
			}
		}
	}
	console.log(winners);
	console.log(tally);
}

function irv() {
	console.log("Instant-runoff election");
	initializeTally(0);
	/* Calculate first preferences */
	firstRound();
	console.log(topPreference);
	/* Check for majority victory */
	majorityCheck();
	/* If a candidate has over half the votes, the election is over. Otherwise... */
	if (winners.length == 0) {
		tempWinners = []; //The tempWinners array stores which candidates are eliminated. 0 = eliminated, 1 = still running.
		for (i = 0; i < candidates.length; i+=1) {
			tempWinners.push(1);
			/* If a candidate received 0 votes, they are eliminated here. */
			if (tally[0][i] == 0) {
				tempWinners[i] = 0;
			}
		}
		while (winners.length < 1) {
			/* The main loop, eliminating candidates until a majority is reached. */
			round += 1;
			initializeTally(round);
			tally[round] = tally[round - 1].slice();
			/* Find the lowest number of votes */
			tempThreshold = votes.length + 1;
			for (i = 0; i < candidates.length; i+=1) {
				if (tally[round][i] < tempThreshold && tally[round][i] !== 0) {
					tempThreshold = tally[round][i];
				}
			}
			console.log(tempThreshold);
			/* Eliminate candidates with the fewest votes */
			for (i = 0; i < candidates.length; i+=1) {
				if (tally[round][i] == tempThreshold) {
					tempWinners[i] = 0;
				}
			}
			console.log(tempWinners);
			/* Distribute preferences of people who voted for an eliminated candidate */
			for (i = 0; i < votes.length; i+=1) {
				if (tempWinners[topPreference[i]] == 0) {
					console.log("Vote " + i + " is being distributed!");
					/* Find the next best valid preference */
					tempThreshold = candidates.length + 1;
					for (j = 0; j < candidates.length; j+=1) {
						if (votes[i][j] < tempThreshold && votes[i][j] !== 0 && tempWinners[j] == 1) {
							tempThreshold = votes[i][j];
						}
					}
					console.log(tempThreshold); //This is the best PREFERENCE number, NOT the best CANDIDATE number
					for (j = 0; j < candidates.length; j+=1) {
						if (votes[i][j] == tempThreshold) {
							/* Distribute the vote */
							tally[round][j] += 1;
							tally[round][topPreference[i]] -= 1;
							topPreference[i] = j;
						}
					}
					console.log(tally[round]);
				}
			}
			/* Check for majority */
			majorityCheck();
			if (round > 100) {
				break; //This is to stop the page from breaking in case something goes wrong
			}
		}
	}
	console.log(winners);
	console.log(tally);
}

function bucklin() {
	console.log("Bucklin voting election");
	initializeTally(0);
	/* Calculate first preferences */
	firstRound();
	console.log(topPreference);
	/* Check for majority victory */
	majorityCheck();
	/* If a candidate has over half the votes, the election is over. Otherwise... */
	if (winners.length == 0) {
		tempThreshold = 0;
		while (tempThreshold < 1) {
			/* The main loop, repeating until someone has more than 50% of the votes. */
			round += 1;
			initializeTally(round);
			tally[round] = tally[round - 1].slice();
			/* Add all of the next preferences to the existing vote counts */
			for (i = 0; i < votes.length; i+=1) {
				for (j = 0; j < candidates.length; j+=1) {
					if (votes[i][j] == round + 1) {
						tally[round][j] += 1;
					}
				}
			}
			/* Check if anyone has at least half of the starting vote count */
			for (i = 0; i < candidates.length; i+=1) {
				if (tally[round][i] >= votes.length / 2) {
					tempThreshold = 1;
				}
			}
			console.log(tally[round]);
			if (round > 100) {
				break; //This is to stop the page from breaking in case something goes wrong
			}
		}
		/* Calculate actual winner(s) */
		console.log("Majority detected");
		threshold = 0;
		for (i = 0; i < candidates.length; i+=1) {
			if (tally[round][i] == threshold) {
				winners[winners.length] = i;
			}
			if (tally[round][i] > threshold) {
				threshold = tally[round][i]
				winners = [];
				winners[0] = i;
			}
		}
	}
	console.log(winners);
	console.log(tally);
}

function borda() {
	console.log("Borda count election");
	initializeTally(0);
	/* Go through each vote and candidate, adding points to the tally */
	for (i = 0; i < votes.length; i+=1) {
		for (j = 0; j < candidates.length; j+=1) {
			tally[0][j] += candidates.length + 1 - votes[i][j];
		}
	}
	console.log(tally[0]);
	/* Find the winner(s) */
	threshold = 0;
	for (i = 0; i < candidates.length; i+=1) {
		if (tally[0][i] == threshold) {
			winners[winners.length] = i;
		}
		if (tally[0][i] > threshold) {
			threshold = tally[0][i]
			winners = [];
			winners[0] = i;
		}
	}
	console.log(winners);
}

/* Small Functions */

function initializeTally(position) {
	tally[position] = [];
	for (i = 0; i < candidates.length; i+=1) {
		tally[position].push(0);
	}
	console.log(tally[position]);
}

function firstRound() {
	round = 0;
	topPreference = []; //Used in IRV
	for (i = 0; i < votes.length; i+=1) {
		for (j = 0; j < candidates.length; j+=1) {
			if (votes[i][j] == 1) {
				tally[round][j] += 1;
				topPreference[i] = j;
			}
		}
	}
	console.log(tally[round]);
}

function majorityCheck() {
	threshold = votes.length / 2;
	for (i = 0; i < candidates.length; i+=1) {
		if (tally[round][i] >= threshold) {
			winners[winners.length] = i;
		}
	}
}

/* Controls */

document.getElementById("process").addEventListener("click", process);
document.getElementById("calculate").addEventListener("click", calculate);
