/* eslint-disable react/jsx-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable  @typescript-eslint/explicit-function-return-type */

import * as React from "react";
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  PersonaSize,
  TooltipDelay,
  TooltipHost,
} from "@fluentui/react";
// import { Avatar } from "primereact/avatar";
// import { AvatarGroup } from "primereact/avatargroup";
import "./CustomComponentStyle.css";

export const LocationBodyTemplate: React.FC<{
  location: any;
  cemeteryListwithBg: any[];
}> = ({ location, cemeteryListwithBg }) => {
  console.log("location", location, cemeteryListwithBg);
  const getBGCode = cemeteryListwithBg?.find(
    (item) => item.title === location
  )?.backgroundColor;
  location = "TestTeamsTestTeamsTestTeamsTestTeamsTestTeams";
  const trimmedLocation =
    location && location.length > 20
      ? location.substring(0, 20) + "..."
      : location || "";
  return (
    <p style={{ whiteSpace: "nowrap" }}>
      <span
        style={{
          backgroundColor: getBGCode ? getBGCode : "#b4b4b4",
          color: "#fff",
          padding: "5px 10px",
          fontWeight: "500",
          borderRadius: "5px",
          fontSize: "13px",
        }}
        title={location}
      >
        {trimmedLocation}
      </span>
    </p>
  );
};

export const UsersBodyTemplate: React.FC<{ users: any[] }> = ({ users }) => {
  return (
    <div className="assign_user_body">
      {users?.length > 0 ? (
        <div
          className="user-selector-group"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "nowrap",
            overflowX: "auto",
            gap: "10px",
          }}
        >
          {users.slice(0, 2).map((value: any, index: number) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Persona
                imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${value.secondaryText}`}
                title={value.text}
                size={PersonaSize.size32}
                styles={{
                  root: {
                    margin: 0,
                    padding: 0,
                  },
                  primaryText: {
                    display: "none", // hide default text from Persona
                  },
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  lineHeight: "32px", // aligns with persona size32
                }}
                title={value.text}
              >
                {value.text}
                {users.length > 1 && users.length !== index + 1 ? ", " : ""}
              </span>
            </div>
          ))}

          {users.length > 2 && (
            <TooltipHost
              content={
                <ul style={{ margin: 10, padding: 0 }}>
                  {users.map((DName: any, index: number) => (
                    <li style={{ listStyleType: "none" }} key={index}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Persona
                          showOverflowTooltip
                          size={PersonaSize.size24}
                          presence={PersonaPresence.none}
                          showInitialsUntilImageLoads
                          imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${DName.secondaryText}`}
                        />
                        <Label style={{ marginLeft: 10, fontSize: 12 }}>
                          {DName.text}
                        </Label>
                      </div>
                    </li>
                  ))}
                </ul>
              }
              delay={TooltipDelay.zero}
              directionalHint={DirectionalHint.bottomCenter}
              styles={{ root: { display: "inline-block" } }}
            >
              <div
                className="custom_persona"
                style={{
                  fontSize: 13,
                  lineHeight: "32px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                +{users.length - 2}
              </div>
            </TooltipHost>
          )}
        </div>
      ) : null}
    </div>
  );
};

// export const UsersBodyTemplate: React.FC<{
//   value: any[];
//   maxVisible?: number;
// }> = ({ value, maxVisible = 2 }) => {
//   console.log("users", value);

//   let visibleUsers = value;
//   let remainingCount = 0;
//   const tooltipValue = value.map((user) => user.DisplayName).join("\n");
//   if (maxVisible > 1) {
//     visibleUsers = value.slice(0, maxVisible);
//     remainingCount = value.length - maxVisible;
//   }
//   return (
//     <>
//       {maxVisible > 1 ? (
//         <div className="avatarGroup">
//           <TooltipHost
//             content={tooltipValue}
//             tooltipProps={{
//               directionalHint: DirectionalHint.bottomCenter,
//               onRenderContent: (props) => (
//                 <div style={{ whiteSpace: "pre-line" }}>{props?.content}</div>
//               ),
//             }}
//           >
//             <AvatarGroup>
//               {visibleUsers.map((user, index) => (
//                 <Avatar
//                   key={index}
//                   image={
//                     "/_layouts/15/userphoto.aspx?size=S&username=" +
//                     `${user.secondaryText}`
//                   }
//                   size="large"
//                   shape="circle"
//                   // style={{width:"25px",height:"25px"}}
//                 />
//               ))}
//               {remainingCount > 0 && (
//                 <TooltipHost
//                   className="all-member-users"
//                   content={
//                     <ul style={{ margin: 10, padding: 0 }}>
//                       {value?.map((DName: any, index: number) => {
//                         return (
//                           <li style={{ listStyleType: "none" }} key={index}>
//                             <div style={{ display: "flex" }}>
//                               <Persona
//                                 showOverflowTooltip
//                                 size={PersonaSize.size24}
//                                 presence={PersonaPresence.none}
//                                 showInitialsUntilImageLoads={true}
//                                 imageUrl={
//                                   "/_layouts/15/userphoto.aspx?size=S&username=" +
//                                   `${DName.secondaryText}`
//                                 }
//                               />
//                               <Label style={{ marginLeft: 10, fontSize: 12 }}>
//                                 {DName.text}
//                               </Label>
//                             </div>
//                           </li>
//                         );
//                       })}
//                     </ul>
//                   }
//                   delay={TooltipDelay.zero}
//                   directionalHint={DirectionalHint.bottomCenter}
//                   styles={{ root: { display: "inline-block" } }}
//                 >
//                   <Avatar
//                     label={
//                       remainingCount < 10
//                         ? `+0${remainingCount}`
//                         : `+${remainingCount}`
//                     }
//                     className="avatar"
//                     shape="circle"
//                     size="large"
//                   />
//                 </TooltipHost>
//               )}
//             </AvatarGroup>
//           </TooltipHost>
//         </div>
//       ) : maxVisible === 1 ? (
//         <div>
//           <AvatarGroup>
//             {visibleUsers.map((user, index) => (
//               <>
//                 <TooltipHost
//                   content={user.DisplayName}
//                   tooltipProps={{
//                     directionalHint: DirectionalHint.bottomCenter,
//                   }}
//                 >
//                   <Avatar
//                     key={index}
//                     image={user.ImgUrl}
//                     size="large"
//                     shape="circle"
//                   />
//                   <span className="avatar_user_name">{user.DisplayName}</span>
//                 </TooltipHost>
//               </>
//             ))}
//           </AvatarGroup>
//         </div>
//       ) : null}
//     </>
//   );
// };

const priorityColors: Record<string, string> = {
  Critical: "#e74c3c",
  High: "#e67e22",
  Medium: "#3498db",
  Low: "#2ecc71",
};

export const PriorityBodyTemplate: React.FC<{
  rowData: any;
}> = ({ rowData }) => {
  return (
    <div
      style={{
        color: `${priorityColors[rowData?.Priority]}`,
        fontWeight: "500",
      }}
    >
      {rowData?.Priority === "Critical" ? (
        <i className="pi pi-info-circle" style={{ fontSize: "0.7rem" }} />
      ) : rowData?.Priority === "High" ? (
        <i className="pi pi-arrow-up" style={{ fontSize: "0.7rem" }} />
      ) : rowData?.Priority === "Low" ? (
        <i className="pi pi-arrow-down" style={{ fontSize: "0.7rem" }} />
      ) : (
        <></>
      )}
      <span style={{ marginLeft: "5px", fontSize: "13px" }}>
        {rowData?.Priority}
      </span>
    </div>
  );
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "not started":
      return "#ff8080";
    case "in progress":
      return "#ffff00a3";
    case "completed":
      return "#008000bf";
    default:
      return "#6C757D";
  }
};
export const ProgressBodyTemplate: React.FC<{
  rowData: any;
}> = ({ rowData }) => {
  return (
    <span
      style={{
        backgroundColor: getStatusColor(rowData?.Progress),
        padding: "2px 10px 5px 10px",
        borderRadius: "50px",
        color:
          rowData?.Progress.toLowerCase() === "completed" ? "#fff" : "black",
        fontWeight: 500,
        display: "inline-block",
        fontSize: "13px",
      }}
    >
      {rowData?.Progress}
    </span>
  );
};

const formattedDate = (date: any) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
};

export const DueDateBodyTemplate: React.FC<{
  rowData: any;
}> = ({ rowData }) => {
  return (
    <span style={{ fontSize: "13px" }} title={formattedDate(rowData?.DueDate)}>
      {formattedDate(rowData?.DueDate)}
    </span>
  );
};
