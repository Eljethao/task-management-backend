import { Document, Types } from 'mongoose';
export interface IStandup extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectId: Types.ObjectId;
    date: Date;
    yesterday: string;
    today: string;
    blockers: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Standup: import("mongoose").Model<IStandup, {}, {}, {}, Document<unknown, {}, IStandup, {}, {}> & IStandup & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Standup.d.ts.map