import React from "react";
 import { User, Heart, ShoppingBag } from "lucide-react";

function Profile() {
  return (
    <div className="profile">

      <div className="profile-item">
        <User size={20} />
        <span>Profile</span>
      </div>

      <div className="profile-item">
        <Heart size={20} />
        <span>Wishlist</span>
      </div>

      <div className="profile-item">
        <ShoppingBag size={20} />
        <span>Bag</span>
      </div>

    </div>
  );
}

export default Profile;