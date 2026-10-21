import type { Job } from 'bullmq';

type FloorCleanliness = 'dusty' | 'dirty' | 'clean';
type FloorCondition = 'faded' | 'good';

interface Floor {
	id: string;
	cleanliness: FloorCleanliness;
	condition: FloorCondition;
}

// Sweep floors

interface SweepFloorInputs {
	broom: 'sweepmaster-4000' | 'sweepmaster-2000';
	dustpan: 'dustmaster-4000' | 'dustmaster-2000';
	floor: {
		id: string;
		cleanliness: 'dusty';
		condition: FloorCondition;
	};
}
interface SweepFloorOutputs {
	floor: {
		id: string;
		cleanliness: 'clean';
		condition: FloorCondition;
	};
}

type SweepFloorJob = Job<SweepFloorInputs, SweepFloorOutputs, 'sweep'>;
// Mop floors

interface MopFloorInputs {
	mop: 'regular-mop';
	bucket: 'wheeled-bucked' | 'handled-bucket';
	floor: {
		id: string;
		cleanliness: 'dirty';
		condition: FloorCondition;
	};
}

interface MopFloorOutputs {
	floor: {
		id: string;
		cleanliness: 'clean';
		condition: FloorCondition;
	};
}

type MopFloorJob = Job<MopFloorInputs, MopFloorOutputs, 'mop'>;

// Stain floors
interface StainFloorInputs {
	floorStain: 'Baer-Dark' | 'Baer-Light' | 'Baer-Natural';
	paintBrush: 'Wide' | 'Roller' | 'Thin';
	floor: {
		id: string;
		cleanliness: 'clean';
		condition: 'faded';
	};
}

interface StainFloorOutputs {
	floor: {
		id: string;
		cleanliness: 'clean';
		condition: 'good';
	};
}

type StainFloorJob = Job<StainFloorInputs, StainFloorOutputs, 'stain'>;
type FloorJobs = SweepFloorJob | MopFloorJob | StainFloorJob;

type FloorWorkerJobs = Job<FloorJobs['data'], FloorJobs['returnvalue'], FloorJobs['name']>;

const runProcess = async (incomingJob: FloorWorkerJobs) => {
	const job = incomingJob as FloorJobs;
	switch (job.name) {
		case 'sweep':
			break;
		case 'mop':
			job;
			break;
		case 'stain':
			job;
	}
};
