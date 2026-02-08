import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSkillExchange } from "../hooks/useSkillExchange";
import { Camera, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { DEPARTMENTS } from "../types";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { totalCredits } = useSkillExchange(user);

  const [skills, setSkills] = React.useState("");
  const [availability, setAvailability] = React.useState("");

  const[bio,setBio]=React.useState("");
  const[department,setDepartment]=React.useState("");

  const [avatar, setAvatar] = React.useState("");
  const fileInputRef = React.useRef(null);

  const [learningSkills, setLearningSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [priority, setPriority] = useState("Medium");



  useEffect(() => {
  if (user) {
    setDepartment(user.department || "");
    setBio(user.bio || "");
    setAvatar(user.avatar || "");
  }
}, [user]);
const hasProfileChanged = ({
  mergedSkills,
  mergedAvailability,
  department,
  bio,
}) => {
  const skillsChanged =
    JSON.stringify(mergedSkills || []) !==
    JSON.stringify(user.skills || []);

  const availabilityChanged =
    JSON.stringify(mergedAvailability || []) !==
    JSON.stringify(user.availability || []);

  const departmentChanged =
    (department || "") !== (user.department || "");

  const bioChanged =
    (bio || "") !== (user.bio || "");
  const avatarChanged =
  (avatar || "") !== (user.avatar || "");


  return (
    skillsChanged ||
    availabilityChanged ||
    departmentChanged ||
    bioChanged ||
    avatarChanged
  );
};

  // -------------------------------
  // ADD / UPDATE PROFILE
  // -------------------------------
  const handleUpdateProfile = async () => {
    try {
      const newSkills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const mergedSkills = newSkills.length > 0 
      ? Array.from(new Set([...(user.skills || []), ...newSkills]))
      : user.skills || [];
      const newAvailability = availability
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);

const mergedAvailability =
  newAvailability.length > 0
    ? Array.from(
        new Set([...(user.availability || []), ...newAvailability])
      )
    : user.availability || [];
if (
  !hasProfileChanged({
    mergedSkills,
    mergedAvailability,
    department,
    bio,
    avatar,
  })
) {
  toast.info("No changes to save");
  return;
}

      const response = await fetch(
        `http://localhost:5000/api/users/profile/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skills: mergedSkills,
            availability: mergedAvailability
              .map((a) => a.trim())
              .filter(Boolean),
              department,
              bio,
              avatar,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      updateProfile({
        skills:mergedSkills,
        availability:mergedAvailability
        .map((a)=>a.trim())
        .filter(Boolean),
        department,
        bio,
        avatar,
      });
      setSkills("");
      setAvailability("");
      toast.success("Profile updated successfully");

      localStorage.setItem("profile_updated_at", Date.now().toString());
    } catch (err) {
      toast.error(err.message);
    }
  };

  // -------------------------------
  // DELETE SINGLE SKILL
  // -------------------------------
  const handleDeleteSkill = async (skillToDelete) => {
    try {
      const updatedSkills = (user.skills || []).filter(
        (skill) => skill !== skillToDelete
      );

      const response = await fetch(
        `http://localhost:5000/api/users/profile/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skills: updatedSkills,
            availability: user.availability || [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove skill");
      }

      updateProfile({skills:updatedSkills});
      toast.success(`Removed "${skillToDelete}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleDeleteAvailability = async (slotToDelete) => {
  try {
    const updatedAvailability = (user.availability || []).filter(
      (slot) => slot !== slotToDelete
    );

    const response = await fetch(
      `http://localhost:5000/api/users/profile/${user.user_id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: user.skills || [],
          availability: updatedAvailability,
          department,
          bio,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove availability");
    }

    updateProfile({ availability: updatedAvailability });
  } catch (err) {
    toast.error(err.message);
  }
};
const formatAvailability = (slot) => {
  const [day, start, end] = slot.split("_");

  const dayMap = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  const formatTime = (time) => {
    const match = time.match(/^(\d+)(am|pm)$/);
    if (!match) return time;
    const [, hour, period] = match;
    return `${hour} ${period.toUpperCase()}`;
  };
  return `${dayMap[day] || day} ${formatTime(start)}-${formatTime(end)}`;
};
const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    setAvatar(reader.result); // base64 string
  };
  reader.readAsDataURL(file);
};

useEffect(() => {
  if (!user) return;

  fetch(`http://localhost:5000/api/users/mentee/${user.user_id}/skills`)
    .then(res => res.json())
    .then(data => {
      if(Array.isArray(data)){
        setLearningSkills(data);
      }else if(Array.isArray(data.skills)){
        setLearningSkills(data.skills);
      }else{
        setLearningSkills([]);
      }
    });
      
}, [user]);

const addSkill = async () => {
  if (!newSkill.trim()) return;

if (newSkill.includes(",")) {
    toast.error("Please add one skill at a time");
    return;
  }

  await fetch("http://localhost:5000/api/users/mentee/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mentee_id: user.user_id,
      skill_name: newSkill.trim(),
      priority,
    }),
  });

  setLearningSkills(prev => {
    const safePrev=Array.isArray(prev) ? prev:[];
    return [
      ...safePrev,
    { 
      id: `${newSkill}-${Date.now()}`, 
      skill_name: newSkill.trim(),
      priority,
      },
    ];
  });

  setNewSkill("");
};

const removeSkill = async (id) => {
  await fetch(
    `http://localhost:5000/api/users/mentee/skills/${id}`,
    { method: "DELETE" }
  );

  setLearningSkills(prev =>
    prev.filter(skill => skill.id !== id)
  );
};

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      {/* PROFILE CARD */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative">
            <UiAvatar className="w-24 h-24">
              <AvatarImage src={avatar ||user.avatar} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </UiAvatar>
            <input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleAvatarChange}
  className="hidden"
/>

            <button
  type="button"
  onClick={() => fileInputRef.current.click()}
  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer"
>
  <Camera className="w-4 h-4 text-primary-foreground" />
</button>

          </div>

          <div>
            <h3 className="text-2xl font-bold">{user.name}</h3>
            <p className="text-muted-foreground">{user.email}</p>
            {user.bio && (
  <p className="text-sm text-muted-foreground mt-1 max-w-md">
    {user.bio}
  </p>
)}

            <div className="flex gap-2 mt-2">
              <Badge className="capitalize">{user.role}</Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {totalCredits} Credits
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PERSONAL INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input defaultValue={user.name} placeholder="Full Name" />
          <Input defaultValue={user.email} placeholder="Email" />
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
               <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
               {DEPARTMENTS.map((dept) => (
               <SelectItem key={dept} value={dept}>
               {dept}
              </SelectItem>
               ))}
             </SelectContent>
          </Select>

          <Textarea 
          value={bio}
          onChange={(e)=>setBio(e.target.value)}
          placeholder="Tell others about yourself" />
        </CardContent>
      </Card>
       <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleUpdateProfile}>Save Changes</Button>
      </div>
      {/* LEARNING SKILLS (MENTEE ONLY) */}
{user.role === "mentee" && (
  <Card>
    <CardHeader>
      <CardTitle>Skills I Want to Learn</CardTitle>
    </CardHeader>

    <CardContent className="space-y-4">
      {/* ADD SKILL */}
      <div className="flex gap-2">
        <Input
          placeholder="e.g. React(one skill at a time)"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
        />

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={addSkill}>Add</Button>
      </div>

      {/* EXISTING LEARNING SKILLS */}
      {learningSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {learningSkills.map((skill) => (
            <Badge
              key={skill.id}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {skill.skill_name} ({skill.priority})
              <button
                onClick={() => removeSkill(skill.id)}
                className="text-red-500 text-xs"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)}


      {/* SKILLS (MENTOR ONLY) */}
      {user.role === "mentor" && (
        <Card>
          <CardHeader>
            <CardTitle>Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* EXISTING SKILLS */}
            {user.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.skills?.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => handleDeleteSkill(skill)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* ADD SKILLS */}
            <div className="space-y-2">
              <Label>Add Skills (comma separated)</Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="python, sql, react"
              />
            </div>

            {/* AVAILABILITY */}
            <div className="space-y-2">
              <Label>Availability</Label>
              {/* EXISTING AVAILABILITY */}
                {user.availability?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {user.availability.map((slot, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {formatAvailability(slot)}
                        <button
                          onClick={() => handleDeleteAvailability(slot)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

              <Input
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="mon_6pm_8pm, wed_8am_9pm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTIONS */}
     
    </div>
  );
};

export default ProfilePage;
