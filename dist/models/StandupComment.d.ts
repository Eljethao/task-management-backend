import { Document, Types } from 'mongoose';
export interface IStandupComment extends Document {
    _id: Types.ObjectId;
    standupId: Types.ObjectId;
    userId: Types.ObjectId;
    body: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const StandupComment: import("mongoose").Model<IStandupComment, {}, {}, {}, Document<unknown, {}, IStandupComment, {}, {}> & IStandupComment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=StandupComment.d.ts.map