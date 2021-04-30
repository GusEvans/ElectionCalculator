'use strict'

/* Setup */

var input; //This is the input from the text box
var method; //This is the voting system specified in the drop-down
var round; //This is used to count the current round of the election
var threshold; //This is used to check whether a candidate's vote count has exceeded a known threshold (usually half)
var tempThreshold; //This is a changeable threshold value, used when the threshold is unknown
var preference; //This is used to store a voter's current preference
var winnerString; //This is used to display the output
var intendedWinners; //This is used to store the number of winners a voting system should produce

var sections = []; //This array is used to split the input data
var candidates = []; //This array stores the names and numbers of candidates
var votes = []; //This array stores the votes as they appear in the ballots
var tally = []; //This array stores the points for each candidate for each round of the election
var winners = []; //This array stores the candidates that have won
var tempWinners = []; //This array stores which candidates advance to a later stage of the election
var topPreference = []; //This array is used for distributing votes correctly in IRV

var i;
var j;

document.getElementById("winners").innerText = "Results will appear here.";
document.getElementById("importStatus").innerText = "Press \"Import Data\" to confirm the data in the box.";
options();

/* Button Functions */

function process() {
	document.getElementById("importStatus").innerText = "Processing...";
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
	document.getElementById("importStatus").innerText = "Data imported!";
}

function calculate() {
	/* Calculate the results based on the method in the drop-down */
	method = document.getElementById("method").value;
	winners = [];
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
		borda(getBordaType());
	}
	if (method == "sntv") {
		sntv(getWinnerCount());
	}
	if (method == "mntv") {
		mntv(getWinnerCount());
	}
	/* Display the results of the election */
	if (winners.length == 1) {
		document.getElementById("winners").innerText = candidates[winners] + " wins the election!";
	}
	if (winners.length < 1) {
		document.getElementById("winners").innerText = "A winner could not be calculated. Make sure all votes are inputted correctly, and then press \"Import Data\" again.";
	}
	if (winners.length > 1 && winners.length !== intendedWinners) {
		winnerString = candidates[winners[0]];
		for (i = 1; i < winners.length; i+=1) {
			winnerString = winnerString + " and " + candidates[winners[i]];
		}
		document.getElementById("winners").innerText = "Tie between " + winnerString;
	}
	if (winners.length > 1 && winners.length == intendedWinners) {
		winnerString = candidates[winners[0]];
		for (i = 1; i < winners.length; i+=1) {
			winnerString = winnerString + " and " + candidates[winners[i]];
		}
		document.getElementById("winners").innerText = winnerString + " win the election!";
	}
	console.log("Winner(s): Candidate " + winners);
}

function options() {
	/* Display options for currently-selected voting system */
	method = document.getElementById("method").value;
	document.getElementById("winnerCountLabel").style.display = "none";
	document.getElementById("bordaTypeLabel").style.display = "none";
	if (method == "sntv" || method == "mntv") {
		document.getElementById("winnerCountLabel").style.display = "";
	}
	if (method == "borda") {
		document.getElementById("bordaTypeLabel").style.display = "";
	}
	/* Display description of currently-selected voting system */
	if (method == "fptp") {
		document.getElementById("description").innerText = "First-past-the-post or plurality voting is the most basic electoral system. "
		+ "Every voter casts a single vote for their most preferred candidate, and the candidate with the most votes wins. "
		+ "It may be simple, but it can easily produce results that are unrepresentative of the views of the population. "
		+ "In this calculator, all first-preference votes are counted and all other preferences are ignored."
	}
	if (method == "top2") {
		document.getElementById("description").innerText = "In a two-round system, there are 2 rounds of voting. Every voter's top preference is counted, "
		+ "and if no-one has a majority, all candidates are eliminated except the top 2, and the election is run again with just these candidates. "
		+ "This calculator simulates the second election by finding which of the top 2 candidates is preferenced higher by each voter, "
		+ "which technically makes it another voting system, called the contingent vote."
	}
	if (method == "irv") {
		document.getElementById("description").innerText = "Instant-runoff voting is the most popular ranked voting system, "
		+ "and is often simply called 'preferential voting', 'ranked-choice voting', or the 'alternative vote'. In the system, everyone's first-preference votes are counted at the start. "
		+ "If no-one has a majority, the last-placed candidate is eliminated, and all votes for that candidate are distributed to the remaining candidate "
		+ "with the highest preference on each voter's ballot. Candidates are eliminated in each round until one reaches a majority. "
		+ "It produces much more representative results than first-past-the-post or the two-round system, but can sometimes produce odd outcomes."
	}
	if (method == "bucklin") {
		document.getElementById("description").innerText = "With Bucklin voting, an election starts by counting everyone's first-preference votes. "
		+ "If no-one has a majority, everyone's second-preference votes are added to the first-preference votes. "
		+ "If someone has a majority of the original number of votes after this, the candidate with the most total votes wins. "
		+ "If not, the election goes to later preferences until a majority is reached. "
	}
	if (method == "borda") {
		document.getElementById("description").innerText = "In the Borda count, each preference is worth a certain number of points, "
		+ "and to win, a candidate must receive the most points. There are a few ways of counting these points. One method makes a first-preference vote "
		+ "worth as many points as there are candidates, and every later preference worth 1 point less, until the last preference is worth 1 point. "
		+ "Another method does the same thing except a first-preference is worth 1 less points than the number of candidates, and the last preference is worth 0 points. "
		+ "Another method called the Dowdall system awards the first preference 1 point, the second preference 1/2 a point, the third 1/3, and so on. "
		+ "The Borda count tends to place more emphasis on later preferences than other ranked voting systems."
	}
	if (method == "sntv") {
		document.getElementById("description").innerText = "In the single non-transferable vote system, each voter casts a single vote, "
		+ "and the candidates with the most votes win the election. This calculator uses the first preference on each ballot as the single vote. "
		+ "This system does not produce proportional results, as votes can easily be split among similar candidates."
	}
	if (method == "mntv") {
		document.getElementById("description").innerText = "In the multiple non-transferable vote system, each voter casts a number of votes "
		+ "equal to the number of intended winners of the election, and the candidates with the most votes win. "
		+ "In this calculator, a voter's top N preferences, where N is the number of intended winners, are counted as equal votes."
	}
}

/* Voting Systems */

function fptp() {
	console.log("First-past-the-post election");
	intendedWinners = 1;
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
	intendedWinners = 1;
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
	intendedWinners = 1;
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
	intendedWinners = 1;
	initializeTally(0);
	/* Calculate first preferences */
	firstRound();
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

function borda(type) {
	console.log("Borda count election");
	intendedWinners = 1;
	initializeTally(0);
	/* Go through each vote and candidate, adding points to the tally */
	for (i = 0; i < votes.length; i+=1) {
		for (j = 0; j < candidates.length; j+=1) {
			if (type == "a") {
				/* First preference receives as many points as there are candidates; last preference receives 1 point. */
				tally[0][j] += candidates.length + 1 - votes[i][j];
				//console.log("Adding " + (candidates.length + 1 - votes[i][j]) + " point(s) to candidate " + j)
			}
			if (type == "b") {
				/* First preference receives points equal to the number candidates minus 1; last preference receives 0 points. */
				tally[0][j] += candidates.length - votes[i][j];
				//console.log("Adding " + (candidates.length - votes[i][j]) + " point(s) to candidate " + j)
			}
			if (type == "c") {
				/* First preference receives 1 point, second preferences receives 1/2, third preference receives 1/3, and so on. */
				tally[0][j] += 1 / votes[i][j];
				//console.log("Adding " + (1 / votes[i][j]) + " point(s) to candidate " + j)
			}
		}
	}
	for (i = 0; i < candidates.length; i+=1) {
		tally[0][i] = Math.round(100 * tally[0][i]) / 100; //Rounded to 2 decimal places to hide ugly floating point numbers
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

function sntv(places) {
	console.log("Single non-transferable vote election");
	intendedWinners = places;
	initializeTally(0);
	/* Calculate results for each candidate */
	firstRound();
	/* Find the winners */
	tempWinners = [];
	for (i = 0; i < candidates.length; i+=1) {
		tempWinners[i] = 0;
	}
	for (i = 0; i < places; i+=1) {
		tempThreshold = 0; //Note: This system currently cannot handle ties for the last winning place; that should be fixed
		for (j = 0; j < candidates.length; j+=1) {
			if (tally[round][j] > tempThreshold && tempWinners[j] !== 1) {
				winners[i] = j;
				tempThreshold = tally[round][j];
			}
		}
		tempWinners[winners[i]] = 1;
		console.log(tempWinners);
	}
	console.log(winners);
}

function mntv(places) {
	console.log("Multiple non-transferable vote election");
	intendedWinners = places;
	initializeTally(0);
	/* Calculate results for each candidate */
	round = 0;
	for (i = 0; i < votes.length; i+=1) {
		for (j = 0; j < candidates.length; j+=1) {
			if (votes[i][j] <= places && votes[i][j] !== 0) {
				tally[round][j] += 1;
			}
		}
	}
	console.log(tally[round]);
	/* Find the winners */
	tempWinners = [];
	for (i = 0; i < candidates.length; i+=1) {
		tempWinners[i] = 0;
	}
	for (i = 0; i < places; i+=1) {
		tempThreshold = 0; //Note: This system currently cannot handle ties for the last winning place; that should be fixed
		for (j = 0; j < candidates.length; j+=1) {
			if (tally[round][j] > tempThreshold && tempWinners[j] !== 1) {
				winners[i] = j;
				tempThreshold = tally[round][j];
			}
		}
		tempWinners[winners[i]] = 1;
		console.log(tempWinners);
	}
	console.log(winners);
}

/* Small Functions */

function confirmImport() {
	document.getElementById("importStatus").innerText = "Press \"Import Data\" to save your changes.";
}

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

function getWinnerCount() {
	return parseInt(document.getElementById("winnerCount").value)
}

function getBordaType() {
	if (document.getElementById("bordaTypeA").checked == true) {
		return "a";
	}
	if (document.getElementById("bordaTypeB").checked == true) {
		return "b";
	}
	if (document.getElementById("bordaTypeC").checked == true) {
		return "c";
	}
}

/* Controls */

document.getElementById("process").addEventListener("click", process);
document.getElementById("calculate").addEventListener("click", calculate);
document.getElementById("method").addEventListener("input", options);
document.getElementById("data").addEventListener("input", confirmImport)
