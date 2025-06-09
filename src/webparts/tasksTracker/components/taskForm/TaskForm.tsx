/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  // IBasePickerSuggestionsProps,
  NormalPeoplePicker,
} from "@fluentui/react/lib/Pickers";
import { Panel, Persona, PersonaSize } from "@fluentui/react";
import { useEffect, useRef, useState } from "react";
import { graph } from "@pnp/graph";
import { Web } from "@pnp/sp/webs";
import { Button } from "primereact/button";
import Webcam from "react-webcam";
import styles from "./TaskForm.module.scss";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { app, media } from "@microsoft/teams-js";
import CustomLoader from "../CustomLoader/CustomLoader";
import "./taskForm.css";
import moment from "moment";
import { Dialog } from "primereact/dialog";
import MediaPreview from "../MediaPreview/MediaPreview";
import useScreenSize from "../DataTable/ScreenSize";

interface taskDetails {
  Title: string;
  Description: string;
  Priority: string;
  Progress: any;
  StartDate: any;
  DueDate: any;
  Id: number;
  AssignedTo: any[];
  CemeteryLocationId?: number;
  CemeteryLocation?: string;
  GroupName?: string;
  Notes?: string;
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
  PreNotes?: string;
  CemeteryLocationId?: number;
  CemeteryLocation?: any;
  GroupName?: string;
  Priority?: any;
  Progress?: any;
  PreProgress?: any;
  StartDate?: any;
  DueDate?: any;
  Id?: any;
  AssignedTo?: any[];
  AssignedBy?: any[];
  TaskType?: string;
  isValid?: boolean;
  recOwner?: boolean;
  reOpenComments?: string;
}
interface TaskFormProps {
  webPartProps: any;
  initialData: formDataDetails | undefined;
  userCemeteryList: dropDownOptions[] | undefined;
  setAllTasksList: React.Dispatch<
    React.SetStateAction<taskDetails[] | undefined>
  >;
  setMasterTasksList: React.Dispatch<
    React.SetStateAction<taskDetails[] | undefined>
  >;
  setOpenForm: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToast: React.Dispatch<React.SetStateAction<any>>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  webPartProps,
  initialData,
  userCemeteryList,
  setAllTasksList,
  setMasterTasksList,
  setOpenForm,
  setShowToast,
}) => {
  // development site
  const listWeb = Web("https://chandrudemo.sharepoint.com/sites/TechnorucsV1");

  // production site
  // const listWeb = Web(
  //   "https://libitinaco.sharepoint.com/sites/CemeterySociety2"
  // );
  const screenType = useScreenSize();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const toast = useRef<Toast>(null);
  const priorityOptions = [
    { key: "Critical", text: "Critical" },
    { key: "High", text: "High" },
    { key: "Medium", text: "Medium" },
    { key: "Low", text: "Low" },
  ];
  const progressOptions = [
    { key: "Not started", text: "Not started" },
    { key: "In progress", text: "In progress" },
    { key: "Job completed", text: "Job completed" },
  ];
  // const completeProgressOptions = [
  //   { key: "Reopen", text: "Reopen" },
  //   { key: "Completed", text: "Completed" },
  // ];

  // React States

  const [formData, setFormData] = useState<formDataDetails>();
  const [allNotes, setAllNotes] = useState<any[]>();
  const [dialogLoader, setDialogLoader] = useState<boolean>(false);
  const [reopenComments, setReopenComments] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showAllNotes, setShowAllNotes] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<boolean>(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);
  const [cemeteryList, setCemeteryList] = useState<dropDownOptions[]>();
  const [adGroupUsers, setADGroupUsers] = useState<
    { text: string; secondaryText: string }[]
  >([]);
  const [images, setImages] = useState<any[]>([]);
  const [isInTeams, setIsInTeams] = useState(true);
  console.log("allNotes", allNotes, formData);

  const onFilterChanged = (filterText: string) => {
    return filterText
      ? adGroupUsers.filter((user) =>
          user.text.toLowerCase().includes(filterText.toLowerCase())
        )
      : [];
  };

  const handleFileUpload = (event: any) => {
    const files = Array.from(event.target.files);
    const existingFileNames = images.map((img: any) => img.name.toLowerCase());

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
      "image/avif",
      "application/pdf",
    ];

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".heic",
      ".heif",
      ".webp",
      ".bmp",
      ".gif",
      ".svg",
      ".tiff",
      ".avif",
      ".pdf",
    ];

    const newFiles = files.filter((file: any) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type;
      const fileExtension = fileName.slice(fileName.lastIndexOf("."));

      const isDuplicate = existingFileNames.includes(fileName);
      const isAllowedType = allowedMimeTypes.includes(fileType);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      if (!isAllowedType && !isAllowedExtension) {
        toast?.current?.show({
          severity: "warn",
          summary: "Unsupported File",
          detail: `File ${file.name} is not a supported type.`,
          life: 3000,
        });
        return false;
      }

      if (isDuplicate) {
        toast?.current?.show({
          severity: "warn",
          summary: "Duplicate File",
          detail: `File ${file.name} is already uploaded.`,
          life: 3000,
        });
        return false;
      }

      return true;
    });

    if (newFiles.length > 0) {
      const newImages = newFiles.map((file: any) => ({
        id: file.name + Date.now(),
        url: URL.createObjectURL(file),
        file,
        name: file.name,
      }));

      setImages([...images, ...newImages]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: any) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);

    // Reset file input field if no images remain
    if (updatedImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to fetch all groups from Microsoft Graph API
  async function getAllGroups(Clients: any): Promise<any[]> {
    let allGroups: any[] = [];
    let url = "/groups"; // Microsoft Graph API endpoint

    try {
      do {
        const response = await Clients.api(url).version("v1.0").get();
        allGroups = allGroups.concat(response.value);

        // Check if there's more data (paging)
        url = response["@odata.nextLink"] || null;
      } while (url);

      return allGroups;
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  }

  // Function to handle form data change

  const formOnChange = async (value: any, field: string) => {
    const tempObj = { ...formData };
    if (field === "CemeteryLocation") {
      if (value?.GroupName !== formData?.GroupName) {
        setDialogLoader(true);
        await webPartProps?.SpContext?._msGraphClientFactory
          .getClient()
          .then(async (client: any) => {
            const groups = await getAllGroups(client);

            // setAdGroupsList([...groups]);
            groups.forEach((group: any) => {
              if (group.displayName.trim() === value?.GroupName.trim()) {
                graph.groups
                  .getById(group?.id)
                  .members.get()
                  .then((result: any) => {
                    const tempArray: any[] = [];
                    result?.forEach((item: any) => {
                      const tempObj = {
                        text: item.displayName,
                        secondaryText: item.mail,
                      };
                      tempArray.push(tempObj);
                    });
                    setADGroupUsers([...tempArray]);
                    setDialogLoader(false);
                  })
                  .catch((err: any) => {
                    console.log(err);
                  });
              }
            });
          });
      }
      setFormData({
        ...formData,
        CemeteryLocationId: value?.Id,
        GroupName: value?.GroupName,
        AssignedTo: [],
        [field]: value,
      });
      return;
    } else {
      if (field === "DueDate") {
        const startDate = new Date(formData?.StartDate);
        const endDate = new Date(value);
        if (endDate < startDate && value) {
          setFormData({ ...formData, DueDate: "" });
          if (toast.current) {
            toast.current.show({
              severity: "warn",
              summary: "Warning",
              detail: "Due date should be after start date",
              life: 3000,
            });
          }
          return;
        } else {
          setFormData({ ...tempObj, [field]: value });
          return;
        }
      }
      setFormData({ ...tempObj, [field]: value });
    }
  };

  const handleUserChange = (items: any[]) => {
    const seen = new Set<string>();
    for (const user of items) {
      const email = user.secondaryText.toLowerCase();
      if (seen.has(email)) {
        toast?.current?.show({
          severity: "warn",
          summary: "Warning",
          detail: `User ${user?.text} already added`,
          life: 3000,
        });
        return;
      }
      seen.add(email);
    }
    formOnChange(items, "AssignedTo");
  };
  const formValidation = () => {
    const tempObj = { ...formData };
    let isvalid = true;
    if (formData?.Title === "") {
      isvalid = false;
    } else if (formData?.CemeteryLocation?.text === "") {
      isvalid = false;
    } else if (formData?.AssignedTo?.length === 0) {
      isvalid = false;
    } else if (formData?.StartDate === "") {
      isvalid = false;
    } else if (formData?.DueDate === "") {
      isvalid = false;
    }
    setFormData({ ...tempObj, isValid: isvalid });
    return isvalid;
  };

  // Function for task form submit

  const taskSubmissionFunction = async (
    isNew: boolean,
    tempFormData: formDataDetails
  ) => {
    const isValid = formValidation();
    if (!isValid) {
      return;
    }
    setDialogLoader(true);
    try {
      const user = await listWeb.currentUser.get();
      const userIds: any[] = [];
      await Promise.all(
        (tempFormData?.AssignedTo || []).map(async (user: any) => {
          await listWeb.ensureUser(user?.secondaryText).then((user: any) => {
            userIds.push(user?.data?.Id);
          });
        })
      );
      const payload = {
        Title: tempFormData?.Title,
        Description: tempFormData?.Description,
        CemeteryLocationId: tempFormData?.CemeteryLocationId,
        AssignedTo0Id: { results: userIds },
        Priority: tempFormData?.Priority,
        Progress:
          tempFormData?.Progress.toLowerCase() === "reopen"
            ? "In progress"
            : tempFormData?.Progress,
        StartDate: new Date(tempFormData?.StartDate),
        DueDate: new Date(tempFormData?.DueDate),
        Notes: tempFormData?.Notes,
      };
      if (isNew) {
        const res = await listWeb.lists
          .getByTitle("AllTasks")
          .items.add(payload);
        const itemId = res.data.Id;
        for (const file of images) {
          // const buffer = await getFileBuffer(file);
          await listWeb.lists
            .getByTitle("AllTasks")
            .items.getById(itemId)
            .attachmentFiles.add(file.name, file.file);
        }
        const notePayload = {
          Note: tempFormData?.Notes,
          CurrentStatus: tempFormData?.Progress,
          TaskOfId: itemId,
        };
        if (
          tempFormData?.Notes?.trimStart() !== "" &&
          tempFormData?.Notes !== tempFormData?.PreNotes
        ) {
          await listWeb.lists.getByTitle("AllNotes").items.add(notePayload);
        }
        const tempObject = {
          Id: itemId,
          Title: tempFormData?.Title,
          Description: tempFormData?.Description,
          CemeteryLocation: tempFormData?.CemeteryLocation?.text,
          CemeteryLocationId: tempFormData?.CemeteryLocationId,
          GroupName: tempFormData?.GroupName,
          AssignedTo: tempFormData?.AssignedTo,
          AssignedBy: [
            {
              text: user?.Title,
              secondaryText: user?.Email,
            },
          ],
          Priority: tempFormData?.Priority,
          Progress:
            tempFormData?.Progress.toLowerCase() === "reopen"
              ? "In progress"
              : tempFormData?.Progress,
          StartDate: tempFormData?.StartDate,
          DueDate: tempFormData?.DueDate,
          Notes: tempFormData?.Notes,
          recOwner: true,
          isAttachment: images?.length > 0 ? true : false,
        };
        setDialogLoader(false);
        setAllTasksList((obj: any) => {
          return [...obj, tempObject].sort((a: any, b: any) => b.Id - a.Id);
        });
        setMasterTasksList((obj: any) => {
          return [...obj, tempObject].sort((a: any, b: any) => b.Id - a.Id);
        });
        setOpenForm(false);
        setImages([]);
        setShowToast({
          severity: "success",
          summary: "Success",
          detail: `The task has been added successfully.`,
          life: 3000,
        });
      } else {
        console.log("form submit", tempFormData);

        listWeb.lists
          .getByTitle("AllTasks")
          .items.getById(tempFormData?.Id)
          .update(payload)
          .then(async (res: any) => {
            const existingAttachments = await listWeb.lists
              .getByTitle("AllTasks")
              .items.getById(tempFormData?.Id)
              .attachmentFiles();
            for (const attachment of existingAttachments) {
              if (
                !images.some((img: any) => img.name === attachment.FileName)
              ) {
                await listWeb.lists
                  .getByTitle("AllTasks")
                  .items.getById(tempFormData?.Id)
                  .attachmentFiles.getByName(attachment.FileName)
                  .delete();
              }
            }

            // Add new attachments
            for (const image of images) {
              // const buffer = await getFileBuffer(image);
              if (
                !existingAttachments.some(
                  (att: any) => att.FileName === image.name
                )
              ) {
                await listWeb.lists
                  .getByTitle("AllTasks")
                  .items.getById(tempFormData?.Id)
                  .attachmentFiles.add(image.name, image.file);
              }
            }
            const notePayload = {
              Note: tempFormData?.Notes,
              CurrentStatus: tempFormData?.Progress,
              TaskOfId: tempFormData?.Id,
            };
            const reOpenNotesPayload = {
              Note: tempFormData?.reOpenComments,
              CurrentStatus: tempFormData?.Progress,
              TaskOfId: tempFormData?.Id,
              reOpenComment: true,
            };
            if (
              tempFormData?.Notes?.trimStart() !== "" &&
              tempFormData?.Notes !== tempFormData?.PreNotes
            ) {
              await listWeb.lists.getByTitle("AllNotes").items.add(notePayload);
            }
            if (tempFormData?.reOpenComments?.trimStart() !== "") {
              await listWeb.lists
                .getByTitle("AllNotes")
                .items.add(reOpenNotesPayload);
            }
            const tempObject = {
              Id: tempFormData?.Id,
              Title: tempFormData?.Title,
              Description: tempFormData?.Description,
              CemeteryLocation: tempFormData?.CemeteryLocation?.text,
              CemeteryLocationId: tempFormData?.CemeteryLocationId,
              GroupName: tempFormData?.GroupName,
              AssignedTo: tempFormData?.AssignedTo,
              AssignedBy: tempFormData?.AssignedBy,
              Priority: tempFormData?.Priority,
              Progress:
                tempFormData?.Progress.toLowerCase() === "reopen"
                  ? "In progress"
                  : tempFormData?.Progress,
              StartDate: tempFormData?.StartDate,
              DueDate: tempFormData?.DueDate,
              Notes: tempFormData?.Notes,
              recOwner: tempFormData?.recOwner,
              isAttachment: images?.length > 0 ? true : false,
            };
            setAllTasksList((prevTasks: any) =>
              prevTasks
                .filter((task: any) => {
                  // If ID matches and progress is 'Completed' → remove it
                  if (
                    task.Id === tempFormData?.Id &&
                    tempFormData?.Progress.toLowerCase() === "completed"
                  ) {
                    return false;
                  }
                  return true; // Keep all others
                })
                .map((task: any) => {
                  // If ID matches and it's NOT completed → update it
                  if (task.Id === tempFormData?.Id) {
                    return tempObject;
                  }
                  return task;
                })
                .sort((a: any, b: any) => b?.Id - a?.Id)
            );

            setMasterTasksList((prevTasks: any) =>
              prevTasks
                .filter((task: any) => {
                  // If ID matches and progress is 'Completed' → remove it
                  if (
                    task.Id === tempFormData?.Id &&
                    tempFormData?.Progress.toLowerCase() === "completed"
                  ) {
                    return false;
                  }
                  return true; // Keep all others
                })
                .map((task: any) => {
                  // If ID matches and it's NOT completed → update it
                  if (task.Id === tempFormData?.Id) {
                    return tempObject;
                  }
                  return task;
                })
                .sort((a: any, b: any) => b?.Id - a?.Id)
            );
            setOpenForm(false);
            setImages([]);
            setDialogLoader(false);
            setShowToast({
              severity: "success",
              summary: "Success",
              detail: "The task has been updated successfully.",
              life: 3000,
            });
          })
          .catch((err: any) => {
            console.log("Error : ", err);
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all notes
  const getAllNotes = (id: any) => {
    listWeb.lists
      .getByTitle("AllNotes")
      .items.filter(`TaskOf eq ${id}`)
      .select("*,TaskOf/Id,Author/Id,Author/Title,Author/EMail")
      .expand("TaskOf,Author")
      .get()
      .then((res: any) => {
        console.log(res);
        const tempArray: any[] = [];
        res?.forEach((item: any) => {
          const tempObj = {
            Id: item.Id,
            Note: item.Note,
            CurrentStatus: item.CurrentStatus,
            Autor: {
              text: item?.Author?.Title,
              secondaryText: item?.Author?.EMail,
            },
            createdDate: item?.Created,
            reOpenComment: item?.reOpenComment ? true : false,
          };
          tempArray.push(tempObj);
        });
        console.log("tempArray", tempArray);

        setAllNotes([...tempArray].reverse());
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  // Function for get task attchments
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
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  // Function to fetch group members

  const setGroupUsers = async (GroupName: string) => {
    await webPartProps?.SpContext?._msGraphClientFactory
      .getClient()
      .then(async (client: any) => {
        const groups = await getAllGroups(client);
        // setAdGroupsList([...groups]);
        groups.forEach((group) => {
          if (group.displayName === GroupName) {
            graph.groups
              .getById(group?.id)
              .members.get()
              .then((result: any) => {
                const tempArray: any[] = [];
                result?.forEach((item: any) => {
                  const tempObj = {
                    text: item.displayName,
                    secondaryText: item.mail,
                  };
                  tempArray.push(tempObj);
                });
                setADGroupUsers([...tempArray]);
                setDialogLoader(false);
              })
              .catch((err: any) => {
                console.log(err);
              });
          }
        });
      });
  };

  // Function to fetch cemetery locations on component mount
  useEffect(() => {
    setDialogLoader(true);
    setFormData(initialData);
    setCemeteryList(userCemeteryList);
    if (initialData?.GroupName && initialData?.Id) {
      getAllNotes(initialData?.Id);
      getAttachments(initialData?.Id);
      setGroupUsers(initialData.GroupName);
    } else {
      setDialogLoader(false);
    }
  }, [initialData?.Id, initialData?.GroupName]);

  useEffect(() => {
    if (window.parent !== window) {
      app.initialize().then(() => {
        app.getContext().then((context) => {
          setIsInTeams(true);
        });
      });
    }
  }, []);

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getPriorityBGColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "critical":
        return "#e74c3c";
      case "high":
        return "#e67e22";
      case "low":
        return "#2ecc71";
      case "medium":
        return "#3498db";
      default:
        return "#fff";
    }
  };
  const getProgressBGColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "not started":
        return "#e67e22";
      case "in progress":
        return "#ffff00a3";
      case "job completed":
        return "#2ecc71";
      case "reopen":
        return "#ffff00a3"; // orange yellow
      case "completed":
        return "#2ecc71"; // grey
      default:
        return "#fff";
    }
  };
  const getPriorityBorderColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "critical":
        return "#e74c3c";
      case "high":
        return "#e67e22";
      case "low":
        return "#2ecc71";
      case "medium":
        return "#3498db";
      default:
        return "#6e6f86";
    }
  };
  const getProgressBorderColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "not started":
        return "#e67e22";
      case "in progress":
        return "#ffff00a3";
      case "job completed":
        return "#2ecc71";
      case "reopen":
        return "#ffff00a3";
      case "completed":
        return "#2ecc71";
      default:
        return "#6e6f86";
    }
  };
  const getProgressColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "not started":
        return "#fff";
      case "in progress":
        return "#000";
      case "job completed":
        return "#fff";
      case "reopen":
        return "#000";
      case "completed":
        return "#fff";
      default:
        return "#6e6f86";
    }
  };

  const handleUploadClick = () => {
    if (isInTeams) {
      // Use Teams SDK to open camera
      media.selectMedia(
        {
          mediaType: media.MediaType.Image,
          maxMediaCount: 1,
          imageProps: {
            sources: [media.Source.Camera],
            startMode: media.CameraStartMode.Photo,
          },
        },
        (err, files) => {
          if (err) {
            console.error("Media capture failed:", err);
          } else if (files && files.length > 0) {
            const file = files[0];
            const byteArray = Uint8Array.from(atob(file.content), (c) =>
              c.charCodeAt(0)
            );
            const blob = new Blob([byteArray], { type: file.mimeType });
            console.log("blob", blob);
          }
        }
      );
    } else {
      // Use normal file input in browser
      fileInputRef.current?.click();
    }
  };

  function formatNoteDate(date: string | Date): string {
    const inputDate = moment(date);
    const now = moment();

    if (inputDate.isSame(now, "day")) {
      return `Today ${inputDate.format("hh:mm A")}`;
    } else if (inputDate.isSame(now.clone().subtract(1, "day"), "day")) {
      return `Yesterday ${inputDate.format("hh:mm A")}`;
    } else {
      return inputDate.format("MM/DD/YYYY hh:mm A");
    }
  }
  const getVisibleProgressOptions = () => {
    // const progress = formData?.Progress?.toLowerCase();
    // const isOwner = !!formData?.recOwner;

    // if (isOwner) {
    //   if (
    //     progress === "job completed" ||
    //     progress === "reopen" ||
    //     progress === "completed"
    //   ) {
    //     // Show only Reopen and Close options for recOwner when task is completed or already reopened/closed
    //     return completeProgressOptions;
    //   }
    // }

    // if (!isOwner) {
    //   if (progress === "completed") {
    //     // Regular user can only see Completed once done
    //     return progressOptions.filter(
    //       (opt: any) => opt.key.toLowerCase() === "completed"
    //     );
    //   }
    // }

    // Default: show regular progress options
    return progressOptions;
  };

  return (
    <div className="taskFormContainer">
      <Toast ref={toast} />
      {dialogLoader ? (
        <div className={styles.dialogLoader}>
          {/* <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "2rem", color: "#6c87a1" }}
          /> */}
          <CustomLoader />
        </div>
      ) : (
        <>
          {imagePreview && (
            // <PreviewImages
            //   imagesData={images}
            //   imageIndex={previewImageIndex}
            //   setImagePreview={setImagePreview}
            // />
            <MediaPreview
              mediaList={images}
              initialIndex={previewImageIndex}
              onClose={setImagePreview}
            />
          )}
          <div className={styles.formHeader}>
            <h3 style={{ margin: "15px 0px" }}>
              {formData?.TaskType === "New"
                ? "New "
                : formData?.TaskType === "View"
                ? "View "
                : "Edit "}
              Task
            </h3>
            <i
              className="pi pi-times"
              style={{ fontSize: "1.0rem", cursor: "pointer" }}
              onClick={() => {
                setImages([]);
                setOpenForm(false);
              }}
            />
          </div>
          <div
            className={`${imagePreview ? styles.hideSection : ""} ${
              styles.dialogContainer
            }`}
          >
            <div className={styles.sectionWrapper}>
              <div
                className={`inputsection ${styles.sectionControl} ${
                  !formData?.isValid
                    ? formData?.Title === ""
                      ? "error"
                      : "noterror"
                    : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="taskTitle">
                  Task Title <span style={{ color: "red" }}>*</span>
                </label>
                {formData?.TaskType !== "View" ? (
                  <InputText
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    value={formData?.Title}
                    onChange={(e) =>
                      formOnChange(
                        capitalizeFirstLetter(e.target.value.trimStart()),
                        "Title"
                      )
                    }
                    id="taskTitle"
                    aria-describedby="username-help"
                    placeholder="Enter here"
                  />
                ) : (
                  <p
                    className="taskTitle"
                    // style={{ margin: "0px", height: "40px", overflow: "auto" }}
                    title={formData?.Title}
                  >
                    {formData?.Title}
                  </p>
                )}
                <span className="errormsg">Please enter title</span>
              </div>
              <div
                className={`inputsection ${styles.sectionControl} ${
                  !formData?.isValid ? "noterror" : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="description">
                  Description
                </label>
                <InputTextarea
                  title={formData?.Description}
                  disabled={
                    formData?.TaskType === "View" || !formData?.recOwner
                      ? true
                      : false
                  }
                  value={formData?.Description}
                  onChange={(e) =>
                    formOnChange(
                      capitalizeFirstLetter(e.target.value.trimStart()),
                      "Description"
                    )
                  }
                  id="description"
                  placeholder="Enter here"
                  rows={3}
                  cols={30}
                  style={{
                    resize: "none",
                    // height: "100%",
                    overflow: "auto",
                  }}
                />
              </div>
            </div>
            <div className={styles.sectionWrapper}>
              <div
                className={`inputsection ${styles.sectionControl} ${
                  !formData?.isValid
                    ? formData?.CemeteryLocation?.text === ""
                      ? "error"
                      : "noterror"
                    : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="location">
                  Cemetery Location <span style={{ color: "red" }}>*</span>
                </label>
                {formData?.TaskType !== "View" ? (
                  <Dropdown
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    id="location"
                    value={formData?.CemeteryLocation}
                    onChange={(e) => formOnChange(e.value, "CemeteryLocation")}
                    options={cemeteryList}
                    optionLabel="text"
                    placeholder="Select a location"
                    className="w-full md:w-14rem"
                    checkmark={true}
                    highlightOnSelect={false}
                  />
                ) : (
                  <p
                    style={{ height: "38px", margin: "0px", fontSize: "14px" }}
                  >
                    {formData?.CemeteryLocation?.text}
                  </p>
                )}
                <span className="errormsg">Please select location</span>
              </div>
              <div
                className={`inputsection ${
                  formData?.TaskType === "View" ? "viewOnly" : ""
                } ${styles.sectionControl} ${
                  !formData?.isValid
                    ? formData?.AssignedTo?.length === 0
                      ? "error"
                      : "noterror"
                    : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="assignTo">
                  Assign To <span style={{ color: "red" }}>*</span>
                </label>
                <NormalPeoplePicker
                  disabled={
                    formData?.TaskType === "View" ||
                    !formData?.recOwner ||
                    formData?.CemeteryLocation?.text === ""
                      ? true
                      : false
                  }
                  onResolveSuggestions={onFilterChanged}
                  getTextFromItem={(item) => item.text || ""}
                  pickerSuggestionsProps={{
                    suggestionsHeaderText: "AD Group Users",
                    noResultsFoundText: "No matching users found",
                  }}
                  itemLimit={10}
                  selectedItems={formData?.AssignedTo}
                  onChange={handleUserChange}
                />
                <span className="errormsg">Please select user</span>
              </div>
            </div>
            {/* <div className={styles.sectionWrapper}></div> */}
            <div className={styles.sectionWrapper}>
              {/* <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  className={`inputsection ${styles.sectionControl} ${
                    !formData?.isValid
                      ? formData?.StartDate === ""
                        ? "error"
                        : "noterror"
                      : "noterror"
                  }`}
                >
                  <label className={styles.sectionLabel} htmlFor="startdate">
                    Start Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <DatePicker
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    minDate={new Date()}
                    maxDate={
                      formData?.DueDate
                        ? new Date(formData?.DueDate)
                        : undefined
                    }
                    componentRef={datePickerRef}
                    // allowTextInput
                    ariaLabel="Select a date. Input format is day slash month slash year."
                    value={formData?.StartDate}
                    onSelectDate={(date?: Date) => {
                      date && formOnChange(date, "StartDate");
                    }}
                    formatDate={onFormatDate}
                    parseDateFromString={onParseDateFromString}
                    className={datePickerStyles.control}
                    strings={defaultDatePickerStrings}
                  />
                  <span className="errormsg">Please select start date</span>
                </div>
                <div
                  className={`inputsection ${styles.sectionControl} ${
                    !formData?.isValid
                      ? formData?.DueDate === ""
                        ? "error"
                        : "noterror"
                      : "noterror"
                  }`}
                >
                  <label className={styles.sectionLabel} htmlFor="duedate">
                    Due Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <DatePicker
                    disabled={
                      formData?.TaskType === "View" ||
                      formData?.StartDate === "" ||
                      !formData?.recOwner
                        ? true
                        : false
                    }
                    minDate={new Date(formData?.StartDate) || new Date()}
                    componentRef={datePickerRef}
                    // allowTextInput
                    ariaLabel="Select a date. Input format is day slash month slash year."
                    value={formData?.DueDate}
                    onSelectDate={(date?: Date) => {
                      date && formOnChange(date, "DueDate");
                    }}
                    formatDate={onFormatDate}
                    parseDateFromString={onParseDateFromString}
                    className={datePickerStyles.control}
                    // DatePicker uses English strings by default. For localized apps, you must override this prop.
                    strings={defaultDatePickerStrings}
                  />
                  <span className="errormsg">Please select duedate</span>
                </div>
              </div> */}

              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  className={`inputsection ${styles.sectionControl} ${
                    !formData?.isValid
                      ? formData?.StartDate === ""
                        ? "error"
                        : "noterror"
                      : "noterror"
                  }`}
                >
                  <label className={styles.sectionLabel} htmlFor="startdate">
                    Start Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <Calendar
                    id="buttondisplay"
                    value={formData?.StartDate}
                    onChange={(e) => formOnChange(e.value, "StartDate")}
                    showIcon
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    minDate={new Date()}
                    maxDate={
                      formData?.DueDate
                        ? new Date(formData?.DueDate)
                        : undefined
                    }
                    dateFormat="mm-dd-yy"
                    placeholder="Select a date"
                  />
                  <span className="errormsg">Please select start date</span>
                </div>
                <div
                  className={`inputsection ${styles.sectionControl} ${
                    !formData?.isValid
                      ? formData?.DueDate === ""
                        ? "error"
                        : "noterror"
                      : "noterror"
                  }`}
                >
                  <label className={styles.sectionLabel} htmlFor="duedate">
                    Due Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <Calendar
                    id="buttondisplay"
                    value={formData?.DueDate}
                    onChange={(e) => formOnChange(e.value, "DueDate")}
                    showIcon
                    disabled={
                      formData?.TaskType === "View" ||
                      formData?.StartDate === "" ||
                      !formData?.recOwner
                        ? true
                        : false
                    }
                    minDate={new Date(formData?.StartDate) || new Date()}
                    dateFormat="mm-dd-yy"
                    placeholder="Select a date"
                  />
                  <span className="errormsg">Please select duedate</span>
                </div>
              </div>
              <div className={`inputsection ${styles.sectionControl}`}>
                <label className={styles.sectionLabel} htmlFor="priority">
                  Priority
                </label>
                {/* {formData?.Priority && (
                  <ChoiceGroup
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    // defaultSelectedKey={formData?.Priority}
                    selectedKey={formData?.Priority}
                    options={priorityOptions}
                    onChange={(key: any, option) =>
                      formOnChange(option?.key, "Priority")
                    }
                  />
                )} */}
                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
                >
                  {priorityOptions?.map((option: any, index: number) => {
                    return (
                      <div
                        key={index}
                        className="optionSection"
                        style={{
                          cursor:
                            formData?.TaskType !== "View" && formData?.recOwner
                              ? "pointer"
                              : "not-allowed",
                          backgroundColor: getPriorityBGColor(
                            formData?.Priority === option?.key
                              ? option?.key
                              : "none"
                          ),
                          border: `1px solid ${getPriorityBorderColor(
                            formData?.Priority === option?.key
                              ? option?.key
                              : "none"
                          )}`,
                          padding: "2px 10px 4px 10px",
                          borderRadius: "50px",
                          color:
                            formData?.Priority === option?.key
                              ? "#fff"
                              : "#6e6f86",
                          boxShadow:
                            formData?.Priority === option?.key
                              ? "rgba(0, 0, 0, 0.35) 0px -50px 36px -28px inset"
                              : "",
                        }}
                        onClick={() =>
                          formData?.TaskType !== "View" &&
                          formData?.recOwner &&
                          formOnChange(option?.key, "Priority")
                        }
                      >
                        {option?.key === "Critical" ? (
                          <i
                            className="pi pi-info-circle"
                            style={{ fontSize: "0.8rem", marginRight: "7px" }}
                          />
                        ) : option?.key === "High" ? (
                          <i
                            className="pi pi-arrow-up"
                            style={{ fontSize: "0.8rem", marginRight: "7px" }}
                          />
                        ) : option?.key === "Low" ? (
                          <i
                            className="pi pi-arrow-down"
                            style={{ fontSize: "0.8rem", marginRight: "7px" }}
                          />
                        ) : (
                          <></>
                        )}
                        <span
                          style={{
                            fontWeight:
                              formData?.Priority === option?.key ? 500 : 400,
                          }}
                        >
                          {option?.key}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {formData?.TaskType !== "New" && (
                <div className={`inputsection ${styles.sectionControl}`}>
                  <label className={styles.sectionLabel} htmlFor="progress">
                    Progress
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    {getVisibleProgressOptions().map(
                      (option: any, index: number) => {
                        const isSelected = formData?.Progress === option?.key;
                        const keyLower = option?.key.toLowerCase();

                        return (
                          <div
                            key={index}
                            className="optionSection"
                            style={{
                              cursor:
                                formData?.TaskType !== "View" &&
                                (formData?.Progress?.toLowerCase() !==
                                  "job completed" ||
                                  !formData?.recOwner)
                                  ? "pointer"
                                  : "not-allowed",
                              backgroundColor: getProgressBGColor(
                                isSelected
                                  ? option?.key
                                  : formData?.Progress?.toLowerCase() ===
                                      "completed" &&
                                    option?.key?.toLowerCase() ===
                                      "job completed"
                                  ? "job completed"
                                  : "none"
                              ),
                              border: `1px solid ${getProgressBorderColor(
                                isSelected
                                  ? option?.key
                                  : formData?.Progress?.toLowerCase() ===
                                      "completed" &&
                                    option?.key?.toLowerCase() ===
                                      "job completed"
                                  ? "job completed"
                                  : "none"
                              )}`,
                              color: getProgressColor(
                                isSelected
                                  ? option?.key
                                  : formData?.Progress?.toLowerCase() ===
                                      "completed" &&
                                    option?.key?.toLowerCase() ===
                                      "job completed"
                                  ? "job completed"
                                  : "none"
                              ),
                              padding: "2px 10px 4px 10px",
                              borderRadius: "50px",
                              boxShadow: isSelected
                                ? "rgba(0, 0, 0, 0.35) 0px -50px 36px -28px inset"
                                : "",
                              textAlign: "center",
                            }}
                            onClick={() =>
                              formData?.TaskType !== "View" &&
                              formData?.TaskType !== "View" &&
                              (formData?.Progress?.toLowerCase() !==
                                "job completed" ||
                                !formData?.recOwner) &&
                              formOnChange(option?.key, "Progress")
                            }
                          >
                            {/* Icons */}
                            {keyLower === "not started" && (
                              <i
                                className="pi pi-ban"
                                style={{
                                  fontSize: "0.8rem",
                                  marginRight: "7px",
                                }}
                              />
                            )}
                            {keyLower === "in progress" && (
                              <i
                                className={`pi ${
                                  isSelected ? "pi-spin" : ""
                                } pi-spinner`}
                                style={{
                                  fontSize: "0.8rem",
                                  marginRight: "7px",
                                }}
                              />
                            )}
                            {keyLower === "job completed" && (
                              <i
                                className="pi pi-check"
                                style={{
                                  fontSize: "0.8rem",
                                  marginRight: "7px",
                                }}
                              />
                            )}
                            {keyLower === "completed" && (
                              <i
                                className="pi pi-check-circle"
                                style={{
                                  fontSize: "0.8rem",
                                  marginRight: "7px",
                                }}
                              />
                            )}
                            {keyLower === "reopen" && (
                              <i
                                className="pi pi-undo"
                                style={{
                                  fontSize: "0.8rem",
                                  marginRight: "7px",
                                }}
                              />
                            )}

                            <span
                              style={{ fontWeight: isSelected ? 500 : 400 }}
                            >
                              {option?.key}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.sectionWrapper}>
              <div className={`inputsection ${styles.sectionControl}`}>
                <label className={styles.sectionLabel} htmlFor="notes">
                  Notes
                </label>
                <InputTextarea
                  title={formData?.Notes}
                  disabled={formData?.TaskType === "View" ? true : false}
                  autoResize={false}
                  value={formData?.Notes}
                  onChange={(e) =>
                    formOnChange(
                      capitalizeFirstLetter(e.target.value.trimStart()),
                      "Notes"
                    )
                  }
                  id="notes"
                  placeholder="Enter here"
                  rows={formData?.TaskType === "New" ? 5 : 6}
                  cols={30}
                />
                {allNotes && allNotes?.length !== 0 && (
                  <span
                    style={{
                      color: "#bc5656",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      width: "100%",
                      textAlign: "end",
                      marginTop: "7px",
                    }}
                    onClick={() => setShowAllNotes(true)}
                  >
                    View all
                  </span>
                )}
              </div>
            </div>
            <div className={styles.fullSectionWrapper}>
              <div className={`inputsection ${styles.sectionControl}`}>
                <div className={styles.attachmentUploader}>
                  <div className={styles.attachmentsBtnSection}>
                    {formData?.TaskType !== "View" && (
                      <label
                        htmlFor="file-upload"
                        className={styles.customFileUpload}
                      >
                        Choose Files
                      </label>
                    )}
                    <input
                      disabled={formData?.TaskType === "View"}
                      id="file-upload"
                      type="file"
                      ref={fileInputRef}
                      multiple
                      capture="environment"
                      accept="image/*,image/heic,image/heif,application/pdf"
                      onChange={handleFileUpload}
                    />

                    {formData?.TaskType !== "View" && (
                      <i
                        className="pi pi-camera"
                        style={{
                          color: "slateblue",
                          fontSize: "1.5rem",
                          display: "none",
                        }}
                        onClick={() => setShowCamera(true)}
                      />
                    )}
                    <button
                      style={{ display: "none" }}
                      type="button"
                      onClick={handleUploadClick}
                    >
                      Upload Image
                    </button>
                  </div>
                  {/* {images?.length > 0 ? ( */}
                  <div
                    className={`${
                      formData?.TaskType === "View"
                        ? styles.viewImageList
                        : styles.imageList
                    } imageList-section ${
                      images?.length === 0 ? "showImages" : ""
                    }`}
                  >
                    {images.map((img, index) => {
                      const name = img.name?.toLowerCase();
                      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                        name
                      );
                      const isPDF = /\.pdf$/i.test(name);
                      const isDoc = /\.(docx?|xlsx?|pptx?)$/i.test(name);
                      return (
                        <div key={index} className={styles.imageCard}>
                          <div className={styles.imgPreview}>
                            {/* <img
                              src={img.url}
                              alt={img.name}
                              onClick={() => {
                                setImagePreview(true);
                                setPreviewImageIndex(index);
                              }}
                            /> */}
                            {isImage ? (
                              <img
                                src={img.url}
                                alt={img.name}
                                onClick={() => {
                                  setImagePreview(true);
                                  setPreviewImageIndex(index);
                                }}
                              />
                            ) : isPDF ? (
                              <div
                                className={styles.fileBox}
                                onClick={() => {
                                  setImagePreview(true);
                                  setPreviewImageIndex(index);
                                }}
                              >
                                <img
                                  src={require("../../../../images/pdf.png")}
                                  alt="PDF"
                                />
                                {/* <a
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  link
                                </a> */}
                              </div>
                            ) : isDoc ? (
                              <div className={styles.fileBox}>
                                <img
                                  src={require("../../../../images/doc.png")}
                                  alt="DOCX"
                                />
                                <a
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  link
                                </a>
                              </div>
                            ) : (
                              <div
                                className={styles.fileBox}
                                onClick={() => {
                                  setImagePreview(true);
                                  setPreviewImageIndex(index);
                                }}
                              >
                                <img
                                  src={require("../../../../images/paper.png")}
                                  alt="File"
                                />
                                {/* <a
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download File
                                </a> */}
                              </div>
                            )}
                            {formData?.TaskType !== "View" && (
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleRemoveImage(index)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="16"
                                  width="16"
                                  viewBox="0 0 24 24"
                                  fill="white"
                                >
                                  <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div title={img.name} className={styles.imageName}>
                            {img.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* // ) : (
                  //   <div className="imageList-section" />
                  // )} */}
                  <div className={`${styles.footerSection} formFooter-section`}>
                    <Button
                      style={{ border: "1px solid #6c757d" }}
                      disabled={dialogLoader}
                      label="Close"
                      severity="secondary"
                      icon="pi pi-times"
                      onClick={() => {
                        setImages([]);
                        setOpenForm(false);
                      }}
                      className="p-button-text"
                      size="small"
                    />
                    {formData?.TaskType !== "View" &&
                      formData?.PreProgress.toLowerCase() !==
                        "job completed" && (
                        <Button
                          severity="secondary"
                          disabled={dialogLoader}
                          label={
                            formData?.TaskType === "New" ? "Submit" : "Update"
                          }
                          icon="pi pi-check"
                          onClick={() => {
                            if (
                              formData?.TaskType === "Edit" &&
                              formData?.Progress?.toLowerCase() === "reopen" &&
                              formData?.reOpenComments === ""
                            ) {
                              setReopenComments(true);
                            } else {
                              if (formData) {
                                taskSubmissionFunction(
                                  formData.TaskType === "New" ? true : false,
                                  formData
                                );
                              }
                            }
                          }}
                          size="small"
                        />
                      )}
                    {formData?.TaskType !== "View" &&
                      formData?.PreProgress.toLowerCase() === "job completed" &&
                      formData?.recOwner && (
                        <Button
                          label="Re-open"
                          icon="pi pi-undo"
                          severity="danger"
                          disabled={dialogLoader}
                          size="small"
                          onClick={() => {
                            setReopenComments(true);
                          }}
                        />
                      )}
                    {formData?.TaskType !== "View" &&
                      formData?.PreProgress.toLowerCase() === "job completed" &&
                      formData?.recOwner && (
                        <Button
                          label="Completed"
                          disabled={dialogLoader}
                          icon="pi pi-check-circle"
                          severity="success"
                          size="small"
                          onClick={() => {
                            taskSubmissionFunction(false, {
                              ...formData,
                              Progress: "Completed",
                            });
                          }}
                        />
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <Panel
        isOpen={showCamera}
        onDismiss={() => setShowCamera(false)}
        headerText="Capture Image"
        isLightDismiss
        isBlocking={false}
        closeButtonAriaLabel="Close"
        type={window.innerWidth < 600 ? 7 : 4} // Full-screen on mobile
      >
        <div className={styles.webcamContainer}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            audio={false}
            className={styles.webcamPreview}
          />

          <div className={styles.cameraBtnGroup}>
            <button
              className={styles.captureBtn}
              onClick={() => {
                const imageSrc = webcamRef.current?.getScreenshot();
                if (imageSrc) {
                  fetch(imageSrc)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const fileName = `photo_${new Date().getTime()}.jpg`;
                      const file = new File([blob], fileName, {
                        type: "image/jpeg",
                      });

                      const newImage = {
                        name: file.name,
                        url: URL.createObjectURL(file),
                        file,
                      };
                      setImages((prev) => [...prev, newImage]);
                      setShowCamera(false);
                    });
                }
              }}
            >
              Take Photo
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowCamera(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Panel>
      {/* <Panel
        isOpen={showAllNotes}
        onDismiss={() => setShowAllNotes(false)}
        headerText="All Notes"
        isLightDismiss
        isBlocking={false}
        closeButtonAriaLabel="Close"
        type={window.innerWidth < 600 ? 7 : 3}
      > */}
      <Dialog
        header="Notes and comments"
        visible={showAllNotes}
        position={"right"}
        style={{
          width:
            screenType === "mobile"
              ? "90%"
              : screenType === "tablet"
              ? "70%"
              : "50%",
          height: "100%",
        }}
        onHide={() => {
          if (!showAllNotes) return;
          setShowAllNotes(false);
        }}
        draggable={false}
        resizable={false}
        closeOnEscape={true}
        dismissableMask
        className="notesDialog"
      >
        <div className="panelContainer">
          {allNotes?.map((note: any, index: number) => {
            return (
              <div
                key={index}
                style={{
                  padding: "10px 15px",
                  border: `1px solid ${
                    note?.reOpenComment ? "#e9baba" : "#e5e5e5"
                  }`,
                  marginTop: "10px",
                  boxShadow: "#007bff33 0px 25px 20px -20px",
                  borderRadius: "5px",
                  background: note?.reOpenComment ? "#f4e3e3a8" : "#fff",
                }}
              >
                {note?.reOpenComment && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "start",
                      fontSize: "13px",
                      color: "#cd5050",
                      fontWeight: "600",
                    }}
                  >
                    Re-open comments
                  </div>
                )}
                <div style={{ padding: "8px 0px" }}>
                  <span>{note?.Note}</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#5e415b",
                    }}
                  >
                    <Persona
                      styles={{
                        root: {
                          margin: "0 !important;",
                          // position: "absolute",
                          borderRadius: "50%",
                          border: "3px solidrgb(255, 255, 255)",
                          height: "25px !important",
                          ".ms-Persona-details": {
                            display: "none",
                          },
                          ".ms-Persona-image": {
                            width: "20px !important",
                            height: "20px !important",
                          },
                          ".ms-Persona-imageArea": {
                            width: "20px !important",
                            height: "20px !important",
                          },
                        },
                      }}
                      imageUrl={
                        "/_layouts/15/userphoto.aspx?size=S&username=" +
                        note?.Autor?.secondaryText
                      }
                      title={note?.Autor?.text}
                      size={PersonaSize.size24}
                    />
                    <span>{note?.Autor?.text}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "start",
                      fontSize: "12px",
                      color: "#5e415b",
                      fontWeight: "600",
                    }}
                  >
                    {formatNoteDate(note?.createdDate)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* </Panel> */}
      </Dialog>
      <Dialog
        id="re_open_comments_dialog"
        header="Re-Open Comments(optional)"
        visible={reopenComments}
        position={"center"}
        style={{
          width:
            screenType === "mobile"
              ? "90%"
              : screenType === "tablet"
              ? "70%"
              : "50%",
          height: "50%",
        }}
        onHide={() => {
          if (!reopenComments) return;
          setReopenComments(false);
        }}
        draggable={false}
        resizable={false}
        closeOnEscape={true}
        dismissableMask
        className="notesDialog"
        footer={
          <div>
            <Button
              severity="secondary"
              disabled={dialogLoader}
              label="Submit"
              icon="pi pi-check"
              onClick={() => {
                setReopenComments(false);
                taskSubmissionFunction(false, {
                  ...formData,
                  Progress: "In progress",
                });
              }}
              size="small"
            />
          </div>
        }
      >
        <div
          className={`inputsection ${styles.sectionControl}`}
          style={{ paddingTop: "10px" }}
        >
          <InputTextarea
            title={formData?.reOpenComments}
            disabled={formData?.TaskType === "View" ? true : false}
            autoResize={true}
            value={formData?.reOpenComments}
            onChange={(e) =>
              formOnChange(
                capitalizeFirstLetter(e.target.value.trimStart()),
                "reOpenComments"
              )
            }
            id="reOpenComments"
            placeholder="Enter here"
            rows={formData?.TaskType === "New" ? 5 : 6}
            cols={30}
          />
          <label
            className={styles.sectionLabel}
            htmlFor="taskTitle"
            style={{
              display: "flex",
              justifyContent: "end",
              color: "#6a4848",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            This comment will be added to the Notes section.
          </label>
        </div>
      </Dialog>
    </div>
  );
};
export default TaskForm;
