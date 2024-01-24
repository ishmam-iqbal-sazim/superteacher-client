import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Flex, Grid, Paper, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import ActionCable from "actioncable";

import { getStreamPosts } from "./Api/StreamMethods";
import StreamHeader from "./Components/StreamHeader/StreamHeader";
import SubjectDetails from "./Components/SubjectDetails/SubjectDetails";
import StreamBody from "./Components/StreamBody/StreamBody";
import CreatePostForm from "./Components/CreatePostForm/CreatePostForm";
import ClassMeetLink from "./Components/ClassMeetLink/ClassMeetLink";
import AddMeetLinkFormModal from "./Components/AddMeetLinkFormModal/AddMeetLinkFormModal";
import AddMeetLinkButton from "./Components/AddMeetLinkButton/AddMeetLinkButton";

const Stream = ({ classroom, setClassroom }) => {
  const [posts, setPosts] = useState([]);

  const [isAddMeetLinkFormModalOpen, setIsAddMeetLinkFormModalOpen] =
    useState(false);

  const closeAddMeetLinkFormModal = () => {
    setIsAddMeetLinkFormModalOpen(false);
  };

  const cable = ActionCable.createConsumer("ws://localhost:3000/cable");
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getStreamPosts(classroom.id);

        const postsInLatestFirstOrder = response.data.messages
          ? response.data.messages.reverse()
          : [];

        setPosts(postsInLatestFirstOrder);
      } catch (error) {
        let message;
        if (error.data) {
          message = error.data.message;
        } else {
          message = error.message;
        }

        if (message) {
          notifications.show({
            color: "red",
            title: "Error",
            message: message,
          });
        }
      }
    };

    fetchData();
  }, [classroom.id]);

  useEffect(() => {
    const subscription = cable.subscriptions.create(
      {
        channel: "GlobalChatChannel",
        classroom_id: classroom.id,
      },
      {
        received: (data) => {
          setPosts([data, ...posts]);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [cable.subscriptions, classroom.id, posts, setPosts]);

  return (
    <Box mx={"auto"} py={"sm"} px={"xl"} mih={"100vh"} width={"100%"}>
      <StreamHeader classroom={classroom} setClassroom={setClassroom} />
      <Flex mt={"xl"}>
        <Flex direction={"column"} gap={"xl"}>
          {classroom.meet_link ? (
            <ClassMeetLink
              setIsAddMeetLinkFormModalOpen={setIsAddMeetLinkFormModalOpen}
              classroom={classroom}
              currentUser={currentUser}
            />
          ) : (
            <>
              {currentUser.role === "teacher" ? (
                <AddMeetLinkButton
                  setIsAddMeetLinkFormModalOpen={setIsAddMeetLinkFormModalOpen}
                />
              ) : null}
            </>
          )}
          <SubjectDetails classroom={classroom} />
        </Flex>
        <Paper pt={"xl"} p={"lg"} w={"100%"} radius={"md"}>
          <Grid h={"100%"}>
            <Grid.Col span={12}>
              <CreatePostForm classroom={classroom} />
            </Grid.Col>
            <Grid.Col span={12} h={"100%"}>
              {posts.length !== 0 ? (
                <StreamBody posts={posts} />
              ) : (
                <Flex justify={"center"} align={"center"} h={"100%"}>
                  <Title order={2} c={"sazim-blue"} mt={"xl"} pt={"xl"}>
                    This is where you share things with the class.
                  </Title>
                </Flex>
              )}
            </Grid.Col>
          </Grid>
        </Paper>
      </Flex>
      <AddMeetLinkFormModal
        open={isAddMeetLinkFormModalOpen}
        close={closeAddMeetLinkFormModal}
        classroom={classroom}
        setClassroom={setClassroom}
      />
    </Box>
  );
};

export default Stream;