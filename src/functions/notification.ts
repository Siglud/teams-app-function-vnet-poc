import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { notificationApp } from "../internal/initialize";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { CardData } from "../cardModels";
import notificationTemplate from "../adaptiveCards/notification-default.json";

export async function notification(
    _: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> {
    context.log("HTTP trigger function processed a request.");

    const pageSize = 100;
    let continuationToken: string | undefined = undefined;
    do {
        const pagedData = await notificationApp.notification.getPagedInstallations(
        pageSize,
        continuationToken
        );
        const installations = pagedData.data;
        continuationToken = pagedData.continuationToken;

        for (const target of installations) {
        await target.sendAdaptiveCard(
            AdaptiveCards.declare<CardData>(notificationTemplate).render({
            title: "New Event Occurred!",
            appName: "Contoso App Notification",
            description: `This is a sample http-triggered notification to ${target.type}`,
            notificationUrl: "https://aka.ms/teamsfx-notification-new",
            })
        );
        }
    } while (continuationToken);
    return { status: 200 }
  }

  app.get("notification", notification);