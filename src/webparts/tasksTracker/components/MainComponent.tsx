/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useState, useEffect } from "react";
// import { DataTable } from "primereact/datatable";
// import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";

// import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
// import { graph } from "@pnp/graph/presets/all";

import styles from "./TasksTracker.module.scss";
import "./style.css";
import "@pnp/graph/groups";
import TaskForm from "./taskForm/TaskForm";
import { AvatarGroup } from "primereact/avatargroup";
import { Avatar } from "primereact/avatar";
import FilterSection from "./FilterSection/FilterSection";
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  PersonaSize,
  TooltipDelay,
  TooltipHost,
} from "@fluentui/react";
import PreviewImages from "./PreviewImages/PreViewImages";

interface taskDetails {
  Title: string;
  Description: string;
  Priority: string;
  Progress: any;
  StartDate: any;
  DueDate: any;
  Id: number;
  AssignedTo: any[];
  AssignedBy: any[];
  CemeteryLocationId?: number;
  CemeteryLocation?: string;
  GroupName?: string;
  Notes?: string;
  recOwner?: boolean;
  isAttachment?: boolean;
}
interface dropDownOptions {
  Id?: number;
  key: string;
  text: string;
  GroupName?: string;
}

interface formDataDetails {
  Title?: string;
  Description?: string;
  Notes?: string;
  CemeteryLocationId?: number;
  CemeteryLocation?: any;
  GroupName?: string;
  Priority?: any;
  Progress?: any;
  StartDate?: any;
  DueDate?: any;
  Id?: any;
  AssignedTo?: any[];
  AssignedBy?: any[];
  TaskType?: string;
  isValid?: boolean;
  recOwner?: boolean;
}

const MainComponent = (props: any) => {
  // const listWeb = Web("https://chandrudemo.sharepoint.com/sites/testXML14");
  const listWeb = Web(
    "https://libitinaco.sharepoint.com/sites/CemeterySociety2"
  );
  // const priorityOrderAsc = ["Low", "Medium", "High", "Critical"];
  // const priorityOrderDesc = [...priorityOrderAsc].reverse();
  const [sortState, setSortState] = useState({ Priority: 0, Date: 0 }); // 0: Default, 1: Asc, 2: Desc

  const [masterTasksList, setMasterTasksList] = useState<taskDetails[]>();
  const [allTasksList, setAllTasksList] = useState<taskDetails[]>();
  const [showTasksList, setShowTasksList] = useState<taskDetails[]>();
  const [userCemeteryList, setUserCemeteryList] = useState<dropDownOptions[]>();
  const [formData, setFormData] = useState<formDataDetails>();
  const [openForm, setOpenForm] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  const [imagePreview, setImagePreview] = useState<boolean>(false);
  const [images, setImages] = useState<any[]>([]);
  // const [itemOffset, setItemOffset] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(9);
  console.log("masterTasksList", masterTasksList);
  console.log("allTasksList", allTasksList);

  const createNewForm = () => {
    setFormData({
      Title: "",
      Description: "",
      CemeteryLocation: {
        Id: "",
        key: "",
        text: "",
        GroupName: "",
      },
      TaskType: "New",
      StartDate: "",
      DueDate: "",
      Priority: "Medium",
      Progress: "Not started",
      AssignedTo: [],
      AssignedBy: [],
      Id: 0,
      isValid: true,
      recOwner: true,
    });
    setOpenForm(true);
  };

  const onOpenForm = (rowData: any, type: string) => {
    setFormData({
      Title: rowData?.Title,
      Description: rowData?.Description,
      TaskType: type,
      StartDate: new Date(rowData?.StartDate),
      DueDate: new Date(rowData?.DueDate),
      Priority: rowData?.Priority,
      Progress: rowData?.Progress,
      AssignedTo: rowData?.AssignedTo,
      AssignedBy: rowData?.AssignedBy,
      Id: rowData?.Id,
      CemeteryLocationId: rowData?.CemeteryLocationId,
      CemeteryLocation: {
        Id: rowData?.CemeteryLocationId,
        key: rowData?.CemeteryLocationId,
        text: rowData?.CemeteryLocation,
        GroupName: rowData?.GroupName,
      },
      GroupName: rowData?.GroupName,
      Notes: rowData?.Notes,
      isValid: true,
      recOwner: rowData?.recOwner,
    });
    setOpenForm(true);
  };

  const getUserBasedGroups = async () => {
    try {
      setIsLoader(true);
      const user = await listWeb.currentUser.get();
      const client = await props?.SpContext?._msGraphClientFactory.getClient();
      let groups: any[] = [];
      let url = `/me/memberOf`;

      while (url) {
        const response = await client.api(url).get();
        if (response?.value) {
          groups = groups.concat(response.value);
        }
        // Check for paging
        url = response["@odata.nextLink"]
          ? response["@odata.nextLink"].replace(
              "https://graph.microsoft.com/v1.0",
              ""
            )
          : null;
      }

      const locationGroupList: dropDownOptions[] = [];
      await listWeb.lists
        .getByTitle("CemeteryGroupConfigure")
        .items.top(5000)
        .get()
        .then((res: any) => {
          res?.forEach((item: any) => {
            const tempObj: dropDownOptions = {
              Id: item.Id,
              key: item.Id,
              text: item.Title,
              GroupName: item.GroupName,
            };
            locationGroupList.push(tempObj);
          });
        })
        .catch((err: any) => {
          console.log(err);
        });

      const userGroupNames: string[] =
        groups?.map((group: any) => group.displayName) || [];

      const permittedLocations = locationGroupList.filter((loc: any) =>
        userGroupNames?.includes(loc?.GroupName)
      );

      const groupIds = permittedLocations.map((g) => g.Id);

      // Build OR filter string: (groupNameID eq 1) or (groupNameID eq 3) ...
      const filterString = groupIds
        .map((id) => `CemeteryLocation eq ${id}`)
        .join(" or ");

      const userBasedTasksList = await listWeb.lists
        .getByTitle("AllTasks")
        .items.select(
          "*,AssignedTo0/Id,AssignedTo0/Title,AssignedTo0/EMail,CemeteryLocation/Id,CemeteryLocation/Title,CemeteryLocation/GroupName,Author/Id,Author/Title,Author/EMail,AttachmentFiles"
        )
        .expand("AssignedTo0,CemeteryLocation,Author,AttachmentFiles")
        .filter(filterString)
        .top(5000) // You can use pagination if needed
        .get();

      const tempArray: taskDetails[] = [];
      userBasedTasksList?.forEach((item: any) => {
        const bindAssignedUsers: any[] = item.AssignedTo0?.map((User: any) => {
          return {
            text: User?.Title,
            secondaryText: User?.EMail,
          };
        });
        const isAssigned = item.AssignedTo0?.some(
          (userDetails: any) =>
            userDetails?.EMail?.toLowerCase() === user?.Email.toLowerCase()
        );

        const isCreatedBy = item?.Author?.Id === user?.Id;

        const tempObj: taskDetails = {
          Id: item.Id,
          Title: item.Title,
          Description: item.Description,
          Priority: item.Priority,
          Progress: item.Progress,
          StartDate: item.StartDate,
          DueDate: item.DueDate,
          AssignedTo: bindAssignedUsers,
          CemeteryLocationId: item.CemeteryLocation?.Id,
          CemeteryLocation: item.CemeteryLocation?.Title,
          Notes: item.Notes,
          GroupName: item.CemeteryLocation?.GroupName,
          recOwner: isCreatedBy ? true : false,
          AssignedBy: [
            {
              text: item.Author?.Title,
              secondaryText: item.Author?.EMail,
            },
          ],
          isAttachment: item?.AttachmentFiles?.length > 0 ? true : false,
        };
        if (isCreatedBy || isAssigned) {
          tempArray.push(tempObj);
        }
      });
      const sortedArray = [...tempArray].sort((a, b) => b.Id - a.Id);
      // setAllTasksList(sortedArray);
      setAllTasksList([...sortedArray]);
      setMasterTasksList([...sortedArray]);
      setUserCemeteryList([...permittedLocations]);
      setIsLoader(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Priority sort function

  // const handlePrioritySortToggle = () => {
  //   const nextState = (sortState?.Priority + 1) % 3;
  //   setSortState({ ...sortState, Priority: nextState });

  //   let sortedTasks = [...(allTasksList || [])];

  //   if (nextState === 1) {
  //     // Ascending priority
  //     sortedTasks.sort(
  //       (a, b) =>
  //         priorityOrderAsc.indexOf(a.Priority) -
  //         priorityOrderAsc.indexOf(b.Priority)
  //     );
  //   } else if (nextState === 2) {
  //     // Descending priority
  //     sortedTasks.sort(
  //       (a, b) =>
  //         priorityOrderDesc.indexOf(a.Priority) -
  //         priorityOrderDesc.indexOf(b.Priority)
  //     );
  //   } else {
  //     // Reset to original (by Id)
  //     sortedTasks = sortedTasks.sort((a: any, b: any) => b.Id - a.Id);
  //   }
  //   setFirst(0);
  //   setAllTasksList(sortedTasks);
  // };

  const handleSortByDate = (Data: taskDetails[], type: string) => {
    debugger;
    const nextState =
      type === "click" ? (sortState?.Date + 1) % 3 : sortState?.Date;
    setSortState({ ...sortState, Date: nextState });

    let sortedTasks = [...Data];

    if (nextState === 1) {
      // Ascending
      sortedTasks.sort(
        (a, b) =>
          new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime()
      );
    } else if (nextState === 2) {
      // Descending
      sortedTasks.sort(
        (a, b) =>
          new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime()
      );
    } else {
      // Default (reset by Id)
      sortedTasks = sortedTasks.sort((a: any, b: any) => b.Id - a.Id);
    }

    setFirst(0);
    setAllTasksList(sortedTasks);
  };

  useEffect(() => {
    getUserBasedGroups();
  }, []);

  useEffect(() => {
    const sliced = allTasksList?.slice(first, first + rows);
    setShowTasksList(sliced);
  }, [first, rows, allTasksList]);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
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

  const formattedDate = (date: any) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .format(new Date(date))
      .replace(/\//g, "-");
  };

  // const descriptionBodyTemplate = (rowData: any) => {
  //   return (
  //     <div>
  //       <p title={rowData?.Description} className="description-body">
  //         {rowData?.Description}
  //       </p>
  //     </div>
  //   );
  // };

  const assignedToBodyTemplate = (rowData: any) => {
    return (
      <AvatarGroup style={{ marginLeft: "10px" }}>
        {rowData?.AssignedTo?.map((person: any, index: number) => {
          return (
            <Avatar
              key={index}
              image={`/_layouts/15/userphoto.aspx?size=S&username=${person.secondaryText}`}
              shape="circle"
              size="normal"
              style={{
                margin: "0 !important",
                border: "3px solid #fff",
                width: "25px",
                height: "25px",
                marginLeft: rowData?.AssignedTo?.length > 1 ? "-10px" : "0",
                // position: "absolute",
                // left: `${positionLeft ? positionLeft * index : 0}px`,
                // top: `${positionTop ? positionTop : 0}px`,
                // zIndex: index,
              }}
              label={person.text}
              title={person.text}
            />
          );
        })}
      </AvatarGroup>
    );
  };

  const usersBodyTemplate = (users: any[]) => {
    return (
      <div>
        {users?.length ? (
          <div
            className="user-selector-group"
            style={{
              display: "flex",
            }}
          >
            {users?.map((value: any, index: number) => {
              if (index < 2) {
                return (
                  <Persona
                    styles={{
                      root: {
                        cursor: "pointer",
                        margin: "0 !important;",
                        ".ms-Persona-details": {
                          display: "none",
                        },
                      },
                    }}
                    imageUrl={
                      "/_layouts/15/userphoto.aspx?size=S&username=" +
                      value.secondaryText
                    }
                    title={value.text}
                    size={PersonaSize.size32}
                  />
                );
              }
            })}

            {users?.length > 2 ? (
              <TooltipHost
                className="all-member-users"
                content={
                  <ul style={{ margin: 10, padding: 0 }}>
                    {users?.map((DName: any) => {
                      return (
                        <li style={{ listStyleType: "none" }}>
                          <div style={{ display: "flex" }}>
                            <Persona
                              showOverflowTooltip
                              size={PersonaSize.size24}
                              presence={PersonaPresence.none}
                              showInitialsUntilImageLoads={true}
                              imageUrl={
                                "/_layouts/15/userphoto.aspx?size=S&username=" +
                                `${DName.secondaryText}`
                              }
                            />
                            <Label style={{ marginLeft: 10, fontSize: 12 }}>
                              {DName.text}
                            </Label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                }
                delay={TooltipDelay.zero}
                directionalHint={DirectionalHint.bottomCenter}
                styles={{ root: { display: "inline-block" } }}
              >
                <div className={styles.Persona}>
                  +{users.length - 2}
                  <div className={styles.AllPersona}></div>
                </div>
              </TooltipHost>
            ) : null}
          </div>
        ) : (
          ""
        )}
      </div>
    );
  };
  const priorityColors: Record<string, string> = {
    Critical: "#e74c3c",
    High: "#e67e22",
    Medium: "#3498db",
    Low: "#2ecc71",
  };

  const priorityBodyTemplate = (rowData: any) => {
    return (
      <div
        style={{
          color: `${priorityColors[rowData.Priority]}`,
          fontWeight: "500",
        }}
      >
        {rowData?.Priority === "Critical" ? (
          <i className="pi pi-info-circle" style={{ fontSize: "0.7rem" }}></i>
        ) : rowData?.Priority === "High" ? (
          <i className="pi pi-arrow-up" style={{ fontSize: "0.7rem" }}></i>
        ) : rowData?.Priority === "Low" ? (
          <i className="pi pi-arrow-down" style={{ fontSize: "0.7rem" }}></i>
        ) : (
          <></>
        )}
        <span style={{ marginLeft: "5px" }}>{rowData?.Priority}</span>
      </div>
    );
  };
  const progressBodyTemplate = (rowData: any) => {
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
        }}
      >
        {rowData?.Progress}
      </span>
    );
  };
  // const startDateBodyTemplate = (rowData: any) => {
  //   return <span>{formattedDate(rowData?.StartDate)}</span>;
  // };

  const dueDateBodyTemplate = (rowData: any) => {
    return <span>{formattedDate(rowData?.DueDate)}</span>;
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <i
          className="pi pi-eye"
          style={{ color: "slateblue", cursor: "pointer" }}
          onClick={() => onOpenForm(rowData, "View")}
        ></i>
        <i
          className="pi pi-file-edit"
          style={{ color: "slateblue", cursor: "pointer" }}
          onClick={() => onOpenForm(rowData, "Edit")}
        ></i>
        {rowData?.isAttachment && (
          <i
            className="pi pi-image"
            style={{ color: "slateblue", cursor: "pointer" }}
            onClick={() => getAttachments(rowData?.Id)}
          ></i>
        )}
      </div>
    );
  };

  // pagination function

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // get Attachments function

  const getAttachments = (id: any) => {
    listWeb.lists
      .getByTitle("AllTasks")
      .items.getById(id)
      .attachmentFiles.get()
      .then((res: any) => {
        const tempArray: any[] = [];
        res?.forEach((item: any) => {
          const tempObj = {
            id: item.Id, // Unique ID
            url: item.ServerRelativeUrl,
            file: item, // Store actual file
            name: item.FileName,
          };
          tempArray.push(tempObj);
        });
        setImages(tempArray);
        setImagePreview(true);
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  return (
    <div>
      {openForm ? (
        <TaskForm
          webPartProps={props}
          initialData={formData}
          userCemeteryList={userCemeteryList}
          setAllTasksList={setAllTasksList}
          setOpenForm={setOpenForm}
        />
      ) : isLoader ? (
        <div className={styles.loaderSection}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "2rem", color: "#6c87a1" }}
          ></i>
        </div>
      ) : imagePreview ? (
        <PreviewImages
          imagesData={images}
          imageIndex={1}
          setImagePreview={setImagePreview}
        />
      ) : (
        <div className="taskTableContainer">
          <div className={styles.headerSection}>
            <div>
              <h3>Task List</h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <FilterSection
                userCemeteryList={userCemeteryList || []}
                masterTasksList={masterTasksList || []}
                setAllTasksList={setAllTasksList}
                setFirst={setFirst}
                handleSortByDate={handleSortByDate}
              />
              {/* <div className="searchBox">
                <Dropdown
                  value={searchQueries?.location}
                  onChange={(e) => serachQueryFunction(e.value, "location")}
                  options={userCemeteryList}
                  optionLabel="text"
                  placeholder="Location"
                  // className="w-full md:w-14rem"
                />
                <Dropdown
                  value={searchQueries?.priority}
                  onChange={(e) => serachQueryFunction(e.value, "priority")}
                  options={priorityOptions}
                  optionLabel="name"
                  placeholder="Priority"
                  // className="w-full md:w-14rem"
                />
                <Dropdown
                  value={searchQueries?.progress}
                  onChange={(e) => serachQueryFunction(e.value, "progress")}
                  options={progressOptions}
                  optionLabel="name"
                  placeholder="Progress"
                  // className="w-full md:w-14rem"
                />
                <InputText
                  value={searchQueries?.text}
                  type="text"
                  className="p-inputtext-sm"
                  placeholder="Search"
                  onChange={(e) => serachQueryFunction(e.target.value, "text")}
                />
                <i
                  className="pi pi-refresh"
                  style={{
                    fontSize: "1.2rem",
                    color: "#fff",
                    background: "#788da9",
                    alignSelf: "center",
                    padding: "7px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                ></i>
              </div> */}
              <Button
                // style={{ backgroundColor: "#69797e" }}
                severity="secondary"
                size="small"
                label="Task"
                icon="pi pi-plus"
                onClick={createNewForm}
              />
            </div>
          </div>
          <div className={styles.desktopView}>
            <div className={styles.taskTableWrapper}>
              <div className={styles.customTableHeader}>
                <div style={{ width: "20%" }}>
                  <p>Title</p>
                </div>
                <div style={{ width: "20%" }}>
                  <p>Cemetery location</p>
                </div>
                <div style={{ width: "10%" }}>
                  <p>Assigned by</p>
                </div>
                <div style={{ width: "10%" }}>
                  <p>Assigned to</p>
                </div>
                <div
                  style={{ width: "10%", cursor: "pointer" }}
                  // onClick={() => handlePrioritySortToggle()}
                >
                  <p>Priority</p>
                  {/* <i
                    className={`${
                      sortState?.Priority === 0
                        ? "pi pi-sort"
                        : sortState?.Priority === 1
                        ? "pi pi-sort-amount-down-alt"
                        : "pi pi-sort-amount-down"
                    }`}
                    style={{ fontSize: "1.0rem" }}
                  ></i> */}
                </div>
                <div style={{ width: "10%" }}>
                  <p>Progress</p>
                </div>
                <div
                  style={{ width: "10%", cursor: "pointer" }}
                  onClick={() => handleSortByDate(allTasksList || [], "click")}
                >
                  <p>Due Date</p>
                  <i
                    className={`${
                      sortState?.Date === 0
                        ? "pi pi-sort"
                        : sortState?.Date === 1
                        ? "pi pi-sort-amount-down-alt"
                        : "pi pi-sort-amount-down"
                    }`}
                    style={{ fontSize: "1.0rem" }}
                  ></i>
                </div>
                <div style={{ width: "10%" }}></div>
              </div>
              <div className={styles.customTable}>
                {showTasksList?.length === 0 && (
                  <div className={styles.noDataFound}>
                    <span>No tasks found</span>
                  </div>
                )}
                {showTasksList?.map((rowData: any, index: number) => (
                  <div className={styles.tableRow} key={index}>
                    <div
                      style={{
                        width: "20%",
                        padding: "10px 15px",
                        fontWeight: "500",
                      }}
                    >
                      {rowData.Title}
                    </div>
                    <div style={{ width: "20%", padding: "10px 15px" }}>
                      {rowData.CemeteryLocation}
                    </div>
                    <div style={{ width: "10%", padding: "10px 15px" }}>
                      {usersBodyTemplate(rowData?.AssignedBy)}
                    </div>
                    <div style={{ width: "10%", padding: "10px 15px" }}>
                      {usersBodyTemplate(rowData?.AssignedTo)}
                    </div>
                    <div style={{ width: "10%", padding: "10px 15px" }}>
                      {priorityBodyTemplate(rowData)}
                    </div>
                    <div style={{ width: "10%", padding: "10px 15px" }}>
                      {progressBodyTemplate(rowData)}
                    </div>
                    <div style={{ width: "10%", padding: "10px 15px" }}>
                      {dueDateBodyTemplate(rowData)}
                    </div>
                    <div style={{ width: "10%", padding: "10px 15px" }}>
                      {actionBodyTemplate(rowData)}
                    </div>
                  </div>
                ))}
              </div>
              {/* <DataTable
                className="taskTable"
                value={showTasksList}
                tableStyle={{ minWidth: "50rem" }}
              >
                <Column
                  style={{ width: "20%", fontWeight: "500" }}
                  field="Title"
                  header="Title"
                ></Column>
                <Column
                  style={{
                    width: "20%",
                  }}
                  field="Description"
                  header="Description"
                  body={descriptionBodyTemplate}
                ></Column>

                <Column
                  style={{
                    width: "15%",
                  }}
                  field="CemeteryLocation"
                  header="Cemetery Location"
                  // body={descriptionBodyTemplate}
                ></Column>
                <Column
                  style={{
                    width: "10%",
                  }}
                  field="AssignTo"
                  header="Assign To"
                  body={assignToBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="Priority"
                  header="Priority"
                  body={priorityBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="Progress"
                  header="Progress"
                  body={progressBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="DueDate"
                  header="Due Date"
                  body={dueDateBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "5%" }}
                  field="Id"
                  header=""
                  body={actionBodyTemplate}
                ></Column>
              </DataTable> */}
            </div>
            {(allTasksList?.length ?? 0) > 9 && (
              <Paginator
                first={first}
                rows={rows}
                totalRecords={allTasksList?.length}
                rowsPerPageOptions={[10, 20, 30]}
                onPageChange={onPageChange}
              />
            )}
          </div>

          <div
            className={`${
              (allTasksList?.length ?? 0) < 5 ? styles.fullmobileView : ""
            } ${styles.mobileView}`}
          >
            {showTasksList?.length === 0 && (
              <div className={styles.noDataFound}>
                <span>No tasks found</span>
              </div>
            )}
            {showTasksList?.map((task: any, index: number) => (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{task.Title}</h3>
                </div>
                <div className={styles.cardContent}>
                  <p>
                    <img
                      src={require("../../../images/marker.png")}
                      alt=""
                      width={15}
                      height={15}
                    />
                    {task.CemeteryLocation}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <p>
                      <img
                        src={require("../../../images/priority-arrows.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      {task.Priority}
                    </p>
                    <p>
                      <img
                        src={require("../../../images/calendar-clock.png")}
                        alt=""
                        width={15}
                        height={15}
                      />{" "}
                      {formattedDate(task.DueDate)}
                    </p>
                    <p>
                      <img
                        src={require("../../../images/users-alt.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      {assignedToBodyTemplate(task)}
                    </p>
                  </div>
                  <div className={styles.cardProgress}>
                    <span
                      style={{
                        backgroundColor: getStatusColor(task?.Progress),
                        padding: "2px 10px 5px 10px",
                        borderRadius: "50px",
                        color:
                          task.Progress.toLowerCase() === "completed"
                            ? "#fff"
                            : "black",
                        fontWeight: 500,
                        display: "inline-block",
                      }}
                    >
                      {task?.Progress}
                    </span>
                    {/* <div style={{ display: "flex", gap: "20px" }}>
                      <i
                        className="pi pi-eye"
                        style={{ color: "slateblue", cursor: "pointer" }}
                        onClick={() => onOpenForm(task, "View")}
                      ></i>
                      <i
                        className="pi pi-file-edit"
                        style={{ color: "slateblue", cursor: "pointer" }}
                        onClick={() => onOpenForm(task, "Edit")}
                      ></i>
                    </div> */}
                    {actionBodyTemplate(task)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(allTasksList?.length ?? 0) > 9 && (
            <div className={`mobilePaginationSec ${styles.mobilePaginator}`}>
              <Paginator
                first={first}
                rows={rows}
                totalRecords={allTasksList?.length}
                onPageChange={onPageChange}
                template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MainComponent;
