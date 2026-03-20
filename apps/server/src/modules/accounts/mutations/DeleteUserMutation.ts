import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";
import { Account } from "../AccountModel";
import { runWithOptionalTransaction } from "../../../database/runWithOptionalTransaction";
import { User } from "../../users/UserModel";
import { deleteSessionsByUserId } from "../../sessions/sessionService";
import type { GraphQLContext } from "../../../types/auth";

const DELETED_HOLDER_NAME = "Usuario removido";

export const DeleteUserMutation = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    userId: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _source: unknown,
    { userId }: { userId: string },
    context: GraphQLContext,
  ) => {
    if (context.auth?.role !== "ADMIN") {
      throw new Error("Apenas administrador pode excluir usuario");
    }

    const account = await Account.findOne({ userId });

    if (!account) {
      throw new Error("Conta do usuario nao encontrada");
    }

    const deletedAt = new Date();
    const deletedByUserId = context.auth.userId;

    await runWithOptionalTransaction(async (dbSession) => {
      const sessionOptions = dbSession ? { session: dbSession } : undefined;

      await deleteSessionsByUserId(userId, sessionOptions);
      account.active = false;
      account.userId = null;
      account.holderName = DELETED_HOLDER_NAME;
      account.deletedAt = deletedAt;
      account.deletedByUserId = deletedByUserId;
      await account.save(sessionOptions);
      await User.deleteOne({ _id: userId }, sessionOptions);
    });

    return true;
  },
};
