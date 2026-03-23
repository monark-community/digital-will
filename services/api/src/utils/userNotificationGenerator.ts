import {
  NotificationType,
  NotificationRecipientRole,
} from "../substreams/interfaces/cleaned/model";

export interface UserNotificationContent {
  title: string;
  message: string;
}

type TemplateArgs = {
  willName: string;
  role: NotificationRecipientRole;
  smName?: string;
};

const templates: Record<
  NotificationType,
  (args: TemplateArgs) => UserNotificationContent
> = {
  [NotificationType.SIGNATURE_REQUEST]: ({ willName }) => ({
    title: "Signature request",
    message: `You have been added to the will "${willName}". Please sign to confirm your participation.`,
  }),

  [NotificationType.WILL_ACTIVATED]: ({ willName, role }) =>
    role === NotificationRecipientRole.PM
      ? {
          title: "Will activated",
          message: `All members have signed. Your will "${willName}" is now active on the blockchain.`,
        }
      : {
          title: "Will activated",
          message: `The will "${willName}" you are part of is now active on the blockchain.`,
        },

  [NotificationType.WILL_CANCELED]: ({ willName }) => ({
    title: "Will canceled",
    message: `The will "${willName}" has been canceled by its owner.`,
  }),

  [NotificationType.WILL_CANCELED_ALL_SM_LEFT]: ({ willName }) => ({
    title: "Will automatically canceled",
    message: `All secondary members have left your will "${willName}". It has been automatically canceled.`,
  }),

  [NotificationType.SM_ADDED]: ({ willName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          title: "Member signed",
          message: `${name} has validated their participation in your will "${willName}".`,
        }
      : {
          title: "New member signed",
          message: `${name} has validated their participation in the will "${willName}".`,
        };
  },

  [NotificationType.SM_UPDATED]: ({ willName, role }) =>
    role === NotificationRecipientRole.SM_TARGET
      ? {
          title: "Your participation updated",
          message: `Your participation details in "${willName}" have been updated by the will owner.`,
        }
      : {
          title: "Member updated",
          message: `A secondary member's participation in "${willName}" has been updated.`,
        },

  [NotificationType.SM_REMOVED]: ({ willName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.SM_TARGET
      ? {
          title: "You were removed",
          message: `You have been removed from the will "${willName}" by its owner.`,
        }
      : {
          title: "Member removed",
          message: `${name} has been removed from the will "${willName}".`,
        };
  },

  [NotificationType.SM_DESISTED]: ({ willName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          title: "Member desisted",
          message: `${name} has withdrawn from your will "${willName}". You may want to add a replacement.`,
        }
      : {
          title: "Member desisted",
          message: `${name} has withdrawn from the will "${willName}".`,
        };
  },

  [NotificationType.SECURITY_PERIOD_UPDATED]: ({ willName }) => ({
    title: "Security period updated",
    message: `The security period for the will "${willName}" has been updated.`,
  }),

  [NotificationType.DEATH_DECLARED]: ({ willName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          title: "URGENT — Death declaration",
          message: `${name} submitted a death declaration for your will "${willName}". Log in immediately to exercise your veto right.`,
        }
      : {
          title: "Death declaration submitted",
          message: `${name} submitted a death declaration for the will "${willName}". The security period has begun.`,
        };
  },

  [NotificationType.DEATH_CONFIRMED]: ({ willName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          title: "Death confirmed",
          message: `${name} confirmed the death declaration for your will "${willName}". Execution has started.`,
        }
      : {
          title: "Death confirmed",
          message: `${name} confirmed the death declaration for the will "${willName}". Execution has started.`,
        };
  },

  [NotificationType.VETO_EXERCISED]: ({ willName }) => ({
    title: "Death declaration declined",
    message: `The primary member of "${willName}" exercised their veto. The will remains active.`,
  }),

  [NotificationType.ASSETS_SWAPPED]: ({ willName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          title: "Assets swapped",
          message: `${name} executed an asset swap in your will "${willName}".`,
        }
      : {
          title: "Assets swapped",
          message: `${name} executed an asset swap in the will "${willName}" you are part of.`,
        };
  },
};

export function generateUserNotification(
  type: NotificationType,
  willName: string,
  role: NotificationRecipientRole = NotificationRecipientRole.SM,
  smName?: string,
): UserNotificationContent {
  return templates[type]({ willName, role, smName });
}
